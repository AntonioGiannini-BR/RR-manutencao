import { neon } from '@neondatabase/serverless';
import { assets } from './assets.js';
const schema = [
  `CREATE TABLE IF NOT EXISTS rr_users (id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')), created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS rr_parts (id UUID PRIMARY KEY, part_number TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT, category TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0), min_quantity INTEGER NOT NULL DEFAULT 5 CHECK (min_quantity >= 0), location TEXT, manufacturer TEXT, price NUMERIC(12,2) CHECK (price IS NULL OR price >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_by UUID REFERENCES rr_users(id))`,
  `CREATE TABLE IF NOT EXISTS rr_transactions (id UUID PRIMARY KEY, part_id UUID NOT NULL REFERENCES rr_parts(id) ON DELETE RESTRICT, part_number TEXT NOT NULL, part_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0), quantity_returned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','returned')), user_id UUID NOT NULL REFERENCES rr_users(id), user_name TEXT NOT NULL, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), returned_at TIMESTAMPTZ, CHECK (quantity_returned <= quantity))`,
  `CREATE INDEX IF NOT EXISTS rr_transactions_created_at_idx ON rr_transactions(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS rr_parts_name_idx ON rr_parts(name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS rr_one_admin_idx ON rr_users(role) WHERE role='admin'`
];
let schemaPromise;
function db(env){if(!env.DATABASE_URL)throw new Error('O PostgreSQL ainda não está conectado. Configure DATABASE_URL nas variáveis do site.');return neon(env.DATABASE_URL)}
async function ready(env){if(!schemaPromise)schemaPromise=(async()=>{let sql=db(env);for(const statement of schema)await sql.query(statement)})();try{await schemaPromise}catch(e){schemaPromise=null;throw e}}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')}
function unb64(s){s=s.replaceAll('-','+').replaceAll('_','/');s+='='.repeat((4-s.length%4)%4);return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
const PBKDF2_ITERATIONS=100000;
async function passwordHash(password,salt){let key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);let bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:PBKDF2_ITERATIONS,hash:'SHA-256'},key,256);return b64(bits)}
async function hashPassword(password){let salt=crypto.getRandomValues(new Uint8Array(16));return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$`+await passwordHash(password,salt)}
async function verifyPassword(password,stored){try{let [,iterations,salt,digest]=stored.split('$');let key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);let bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:unb64(salt),iterations:Number(iterations),hash:'SHA-256'},key,256);let actual=b64(bits);return actual===digest}catch{return false}}
async function signToken(user,secret){let head=b64(new TextEncoder().encode(JSON.stringify({alg:'HS256',typ:'JWT'}))),payload=b64(new TextEncoder().encode(JSON.stringify({sub:user.id,email:user.email,name:user.name,role:user.role,exp:Math.floor(Date.now()/1000)+43200}))),data=head+'.'+payload,key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']),sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data));return data+'.'+b64(sig)}
async function auth(request,env){let raw=request.headers.get('authorization')||'',t=raw.startsWith('Bearer ')?raw.slice(7):'',parts=t.split('.');if(parts.length!==3||!env.JWT_SECRET)throw Object.assign(new Error('Sua sessão expirou. Entre novamente.'),{status:401});let data=parts[0]+'.'+parts[1],key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.JWT_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']),ok=await crypto.subtle.verify('HMAC',key,unb64(parts[2]),new TextEncoder().encode(data));if(!ok)throw Object.assign(new Error('Sessão inválida.'),{status:401});let claims=JSON.parse(new TextDecoder().decode(unb64(parts[1])));if(claims.exp<Date.now()/1000)throw Object.assign(new Error('Sua sessão expirou. Entre novamente.'),{status:401});return claims}
function camel(row){if(!row)return row;return {id:row.id,partNumber:row.part_number,name:row.name,partName:row.part_name??row.name,description:row.description,category:row.category,quantity:Number(row.quantity),minQuantity:Number(row.min_quantity),location:row.location,manufacturer:row.manufacturer,price:row.price==null?null:Number(row.price),createdAt:row.created_at,updatedAt:row.updated_at,createdBy:row.created_by,partId:row.part_id,userId:row.user_id,userName:row.user_name,notes:row.notes,type:'withdrawal',status:row.status,returnedAt:row.returned_at,quantityReturned:Number(row.quantity_returned||0)}}
function userOut(row){return {id:row.id,email:row.email,name:row.name,role:row.role}}
async function handleApi(request,env){let u=new URL(request.url),path=u.pathname.replace(/^\/api/,'');if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':u.origin,'access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'Content-Type,Authorization'}});try{await ready(env);let sql=db(env),body=()=>request.json();
if(path==='/health'&&request.method==='GET')return json({status:'ok',database:'connected'});
if(path==='/auth/signup'&&request.method==='POST'){let b=await body(),email=String(b.email||'').trim().toLowerCase(),name=String(b.name||'').trim(),password=String(b.password||'');if(!email||!name||password.length<8)return json({error:'Informe nome, e-mail e uma senha com pelo menos 8 caracteres.'},400);let id=crypto.randomUUID(),hash=await hashPassword(password);try{let rows=await sql`INSERT INTO rr_users (id,email,name,password_hash,role) VALUES (${id},${email},${name},${hash},CASE WHEN NOT EXISTS (SELECT 1 FROM rr_users WHERE role='admin') THEN 'admin' ELSE 'user' END) RETURNING id,email,name,role`;let out=userOut(rows[0]);return json({user:out,token:await signToken(out,env.JWT_SECRET)},201)}catch(e){if(String(e).includes('unique')||String(e).includes('duplicate')){let existing=await sql`SELECT id FROM rr_users WHERE email=${email}`;if(existing.length)return json({error:'Este e-mail já possui cadastro.'},409);let rows=await sql`INSERT INTO rr_users (id,email,name,password_hash,role) VALUES (${id},${email},${name},${hash},'user') RETURNING id,email,name,role`;let out=userOut(rows[0]);return json({user:out,token:await signToken(out,env.JWT_SECRET)},201)}throw e}}
if(path==='/auth/login'&&request.method==='POST'){let b=await body(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');let rows=await sql`SELECT id,email,name,password_hash,role FROM rr_users WHERE email=${email} LIMIT 1`;if(!rows[0]||!await verifyPassword(password,rows[0].password_hash))return json({error:'E-mail ou senha incorretos.'},401);let out=userOut(rows[0]);return json({user:out,token:await signToken(out,env.JWT_SECRET)})}
if(path==='/auth/me'&&request.method==='GET'){let c=await auth(request,env),rows=await sql`SELECT id,email,name,role FROM rr_users WHERE id=${c.sub} LIMIT 1`;if(!rows[0])return json({error:'Conta não encontrada.'},401);return json({user:userOut(rows[0])})}
let current=await auth(request,env);if(path==='/parts'&&request.method==='GET'){let rows=await sql`SELECT * FROM rr_parts ORDER BY name`;return json({parts:rows.map(camel)})}
if(path==='/parts'&&request.method==='POST'){if(current.role!=='admin')return json({error:'Somente administradores podem cadastrar peças.'},403);let b=await body(),number=String(b.partNumber||'').trim(),name=String(b.name||'').trim(),category=String(b.category||'').trim(),quantity=Number(b.quantity),minimum=Number(b.minQuantity??5);if(!number||!name||!category||!Number.isInteger(quantity)||quantity<0||!Number.isInteger(minimum)||minimum<0)return json({error:'Confira os campos obrigatórios e as quantidades.'},400);let rows=await sql`INSERT INTO rr_parts(id,part_number,name,description,category,quantity,min_quantity,location,manufacturer,price,created_by) VALUES(${crypto.randomUUID()},${number},${name},${b.description||null},${category},${quantity},${minimum},${b.location||null},${b.manufacturer||null},${b.price??null},${current.sub}) RETURNING *`;return json({part:camel(rows[0])},201)}
let pm=path.match(/^\/parts\/([\w-]+)$/);if(pm&&request.method==='PUT'){if(current.role!=='admin')return json({error:'Somente administradores podem editar peças.'},403);let b=await body(),mapping={partNumber:'part_number',name:'name',description:'description',category:'category',quantity:'quantity',minQuantity:'min_quantity',location:'location',manufacturer:'manufacturer',price:'price'},sets=[];for(let [k,col] of Object.entries(mapping))if(Object.hasOwn(b,k)){let v=b[k];if(['quantity','minQuantity'].includes(k)){v=Number(v);if(!Number.isInteger(v)||v<0)return json({error:'Quantidades devem ser números inteiros não negativos.'},400)}sets.push({col,v})}if(!sets.length)return json({error:'Nenhum campo para atualizar.'},400);let vals=sets.map(x=>x.v);let query=`UPDATE rr_parts SET ${sets.map((x,i)=>x.col+' = $'+(i+1)).join(', ')}, updated_at=now() WHERE id = $${sets.length+1} RETURNING *`;let result=await sql.query(query,[...vals,pm[1]]);return result.length?json({part:camel(result[0])}):json({error:'Peça não encontrada.'},404)}
if(pm&&request.method==='DELETE'){if(current.role!=='admin')return json({error:'Somente administradores podem excluir peças.'},403);let rows=await sql`DELETE FROM rr_parts WHERE id=${pm[1]} RETURNING id`;return rows.length?json({success:true}):json({error:'Peça não encontrada ou já movimentada.'},409)}
if(path==='/transactions'&&request.method==='GET'){let rows=await sql`SELECT * FROM rr_transactions ORDER BY created_at DESC`;return json({transactions:rows.map(camel)})}
if(path==='/transactions'&&request.method==='POST'){let b=await body(),qty=Number(b.quantity);if(!b.partId||!Number.isInteger(qty)||qty<1)return json({error:'Selecione uma peça e informe uma quantidade válida.'},400);let rows=await sql`WITH changed AS (UPDATE rr_parts SET quantity=quantity-${qty},updated_at=now() WHERE id=${b.partId} AND quantity>=${qty} RETURNING id,part_number,name) INSERT INTO rr_transactions(id,part_id,part_number,part_name,quantity,user_id,user_name,notes) SELECT ${crypto.randomUUID()},changed.id,changed.part_number,changed.name,${qty},${current.sub},${current.name},${b.notes||null} FROM changed RETURNING *`;return rows.length?json({transaction:camel(rows[0])},201):json({error:'Peça não encontrada ou quantidade indisponível em estoque.'},409)}
let tm=path.match(/^\/transactions\/([\w-]+)\/return$/);if(tm&&request.method==='PUT'){let b=await body(),qty=Number(b.quantityReturned);if(!Number.isInteger(qty)||qty<1)return json({error:'Informe uma quantidade de devolução válida.'},400);let rows=await sql`WITH eligible AS (SELECT id,part_id,quantity,quantity_returned FROM rr_transactions WHERE id=${tm[1]} AND quantity_returned+${qty}<=quantity), restored AS (UPDATE rr_parts p SET quantity=p.quantity+${qty},updated_at=now() FROM eligible e WHERE p.id=e.part_id RETURNING p.id), updated AS (UPDATE rr_transactions t SET quantity_returned=t.quantity_returned+${qty},status=CASE WHEN t.quantity_returned+${qty}=t.quantity THEN 'returned' ELSE 'active' END,returned_at=now() FROM eligible e,restored r WHERE t.id=e.id AND r.id=e.part_id RETURNING t.*) SELECT * FROM updated`;return rows.length?json({transaction:camel(rows[0])}):json({error:'Devolução maior que o saldo pendente ou registro inexistente.'},409)}
return json({error:'Rota não encontrada.'},404)}catch(e){console.error('API error',e);let text=String(e.message||e);let status=e.status||(text.includes('foreign key')||text.includes('violates foreign key')?409:500);let msg=status<500?e.message:(text.includes('DATABASE_URL')?e.message:'Erro interno ao acessar o PostgreSQL. Confira as variáveis e o schema do banco.');return json({error:msg},status)}}

const mimeTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
function staticResponse(request){
  const url=new URL(request.url);const key=url.pathname==='/'?'/index.html':url.pathname;
  const encoded=assets[key]??(key.includes('.')?null:assets['/index.html']);
  if(!encoded)return new Response('Not found',{status:404});
  const binary=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const ext=key.slice(key.lastIndexOf('.'));
  return new Response(binary,{headers:{'content-type':mimeTypes[ext]||'application/octet-stream','cache-control':key.includes('/assets/')?'public, max-age=31536000, immutable':'no-cache'}});
}
const ALLOWED_ORIGIN = "https://antoniogiannini-br.github.io";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return staticResponse(request);
    }

    const response = await handleApi(request, env);
    const headers = new Headers(response.headers);

    if (request.headers.get("Origin") === ALLOWED_ORIGIN) {
      headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
      headers.set("Vary", "Origin");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
