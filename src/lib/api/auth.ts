/**
 * EcoIntel Client API — Authentication SDK
 */

export async function register(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  organizationName?: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(credentials: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

export async function getMe(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/auth/me", { headers });
  return res.json();
}

export async function logout() {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  return res.json();
}
