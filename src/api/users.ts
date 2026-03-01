import type { ApiClient } from "./client";

export async function getMe(client: ApiClient): Promise<unknown> {
  const res = await client.get("/users/me");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? "Failed to fetch profile");
  }
  const data = await res.json();
  return data?.data ?? data;
}

export async function updateMe(client: ApiClient, body: Record<string, unknown>): Promise<unknown> {
  const res = await client.patch("/users/me", body);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? "Failed to update profile");
  }
  const data = await res.json();
  return data?.data ?? data;
}
