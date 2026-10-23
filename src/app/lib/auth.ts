const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "rr_token";
const USER_KEY = "rr_user";

type ApiUser = { id: string; email: string; name: string; role: "admin" | "user" };
function shapeUser(user: ApiUser) {
  return { id: user.id, email: user.email, user_metadata: { name: user.name, isAdmin: user.role === "admin" }, role: user.role };
}
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Falha na solicitação");
  return data;
}
export async function signUp(email: string, password: string, name: string) {
  const data = await request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name }) });
  return { user: shapeUser(data.user) };
}
export async function signIn(email: string, password: string) {
  const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return { user: shapeUser(data.user), session: { access_token: data.token } };
}
export async function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export async function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const data = await request("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return shapeUser(data.user);
}
export async function getSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { access_token: token } : null;
}
