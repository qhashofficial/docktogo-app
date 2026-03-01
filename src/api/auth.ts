import type { UserProfile } from "../types/api";

const getBaseUrl = () => import.meta.env.VITE_API_URL as string;

export type AuthMeResponse = { profile: UserProfile; permissions: string[] };

export async function getMe(get: (path: string) => Promise<Response>): Promise<AuthMeResponse> {
  const res = await get("/auth/me");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? "Failed to fetch session");
  }
  const data = await res.json();
  if (data?.status !== "ok" || !data?.data) throw new Error("Invalid session");
  return { profile: data.data.profile, permissions: data.data.permissions ?? [] };
}

export async function login(email: string, password: string): Promise<{
  status: string;
  data?: { access_token: string };
  message?: string;
}> {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "Login failed");
  }
  return data;
}

export async function refresh(): Promise<string | null> {
  const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.status === "ok" && data?.data?.access_token) {
    return data.data.access_token;
  }
  return null;
}

export async function logout(): Promise<void> {
  await fetch(`${getBaseUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
