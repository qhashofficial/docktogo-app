import type { ApiResponse, Dock, DockQueueEntry } from "../types/api";

export async function listDocks(get: (path: string) => Promise<Response>, branchId: string): Promise<Dock[]> {
  const res = await get(`/api/v1/docks?branchId=${encodeURIComponent(branchId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to fetch docks");
  }
  const json: ApiResponse<Dock[]> = await res.json();
  return json.data ?? [];
}

export async function createDock(
  post: (path: string, body?: unknown) => Promise<Response>,
  branchId: string,
  name: string
): Promise<Dock> {
  const res = await post("/api/v1/docks", { branchId, name });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to create dock");
  }
  const json: ApiResponse<Dock> = await res.json();
  return json.data;
}

export async function setDockBlock(
  patch: (path: string, body?: unknown) => Promise<Response>,
  dockId: string,
  block: boolean,
  branchId: string
): Promise<Dock> {
  const res = await patch(`/api/v1/docks/${dockId}/block?branchId=${encodeURIComponent(branchId)}`, { block });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to update dock");
  }
  const json: ApiResponse<Dock> = await res.json();
  return json.data;
}

export async function getDockQueue(get: (path: string) => Promise<Response>, dockId: string): Promise<DockQueueEntry[]> {
  const res = await get(`/api/v1/docks/${dockId}/queue`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to fetch queue");
  }
  const json: ApiResponse<DockQueueEntry[]> = await res.json();
  return json.data ?? [];
}

export async function assignTransportToDock(
  post: (path: string, body?: unknown) => Promise<Response>,
  dockId: string,
  transportId: string,
  branchId: string,
  queueIfOccupied?: boolean
): Promise<{ dock: Dock; assignment: string; position?: number }> {
  const res = await post(`/api/v1/docks/${dockId}/assign?branchId=${encodeURIComponent(branchId)}`, {
    transportId,
    queueIfOccupied: queueIfOccupied === true,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to assign transport");
  }
  const json = await res.json();
  return json.data;
}

export async function promoteNextInQueue(
  post: (path: string, body?: unknown) => Promise<Response>,
  dockId: string
): Promise<{ dock: Dock; promotedTransportId: string }> {
  const res = await post(`/api/v1/docks/${dockId}/promote-next`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to promote next");
  }
  const json = await res.json();
  return json.data;
}
