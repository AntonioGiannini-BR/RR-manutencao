import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const [root, target] = process.argv.slice(2);
if (!root || !target) throw new Error('Usage: node scripts/embed-assets.mjs <asset-dir> <output-file>');
async function walk(dir) {
  let rows=[];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) rows.push(...await walk(full));
    else rows.push(full);
  }
  return rows;
}
const entries={};
for(const file of await walk(root)) {
  const key='/'+path.relative(root,file).split(path.sep).join('/');
  entries[key]=(await readFile(file)).toString('base64');
}
await writeFile(target,`export const assets = ${JSON.stringify(entries)};\n`);
