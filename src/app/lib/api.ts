import { getSession } from "./auth";
const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
async function getAuthHeaders(requireAuth = true) {
  const session = await getSession();
  if (requireAuth && !session?.access_token) throw new Error("Usuário não autenticado");
  return { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) };
}
async function call(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(await getAuthHeaders()), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Falha ao acessar o servidor");
  return data;
}
export interface Part { id: string; partNumber: string; name: string; description?: string; category: string; quantity: number; minQuantity?: number; location?: string; manufacturer?: string; price?: number; createdAt: string; updatedAt: string; createdBy: string; }
export interface Transaction { id: string; partId: string; partNumber: string; partName: string; quantity: number; type: "withdrawal" | "return"; status: "active" | "returned"; userId: string; userName: string; notes?: string; createdAt: string; returnedAt?: string; quantityReturned?: number; }
export async function getParts(): Promise<Part[]> { return (await call("/parts")).parts; }
export async function createPart(data: Omit<Part,"id"|"createdAt"|"updatedAt"|"createdBy">): Promise<Part> { return (await call("/parts",{method:"POST",body:JSON.stringify(data)})).part; }
export async function updatePart(id:string,updates:Partial<Part>):Promise<Part>{return (await call(`/parts/${id}`,{method:"PUT",body:JSON.stringify(updates)})).part;}
export async function deletePart(id:string):Promise<void>{await call(`/parts/${id}`,{method:"DELETE"});}
export async function getTransactions():Promise<Transaction[]>{return (await call("/transactions")).transactions;}
export async function createTransaction(data:{partId:string;partNumber:string;partName:string;quantity:number;notes?:string}):Promise<Transaction>{return (await call("/transactions",{method:"POST",body:JSON.stringify(data)})).transaction;}
export async function returnTransaction(id:string,quantityReturned:number):Promise<Transaction>{return (await call(`/transactions/${id}/return`,{method:"PUT",body:JSON.stringify({quantityReturned})})).transaction;}
