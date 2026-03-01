import type { ApiResponse, Branch } from "../types/api";

export async function listBranches(get: (path: string) => Promise<Response>): Promise<Branch[]> {
  const res = await get("/api/v1/branches");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to fetch branches");
  }
  const json: ApiResponse<Branch[]> = await res.json();
  return json.data ?? [];
}

export async function createBranch(
  post: (path: string, body?: unknown) => Promise<Response>,
  payload: { name: string; code: string }
): Promise<Branch> {
  const res = await post("/api/v1/branches", payload);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to create branch");
  }
  const json: ApiResponse<Branch> = await res.json();
  return json.data;
}
