import type { ApiResponse, Transport, TransportDetail, TransportOperationalStatus } from "../types/api";

export async function listTransports(
  get: (path: string) => Promise<Response>,
  branchId: string,
  filters?: { operationalStatus?: string; businessStatus?: string }
): Promise<Transport[]> {
  const params = new URLSearchParams({ branchId });
  if (filters?.operationalStatus) params.set("operationalStatus", filters.operationalStatus);
  if (filters?.businessStatus) params.set("businessStatus", filters.businessStatus);
  const res = await get(`/api/v1/transports?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to fetch transports");
  }
  const json: ApiResponse<Transport[]> = await res.json();
  return json.data ?? [];
}

export async function getTransportDetail(
  get: (path: string) => Promise<Response>,
  transportId: string,
  branchId: string
): Promise<TransportDetail> {
  const res = await get(`/api/v1/transports/${transportId}?branchId=${encodeURIComponent(branchId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to fetch transport");
  }
  const json: ApiResponse<TransportDetail> = await res.json();
  return json.data;
}

export async function updateTransportStatus(
  patch: (path: string, body?: unknown) => Promise<Response>,
  transportId: string,
  toStatus: TransportOperationalStatus,
  branchId: string,
  reason?: string
): Promise<Transport> {
  const res = await patch(
    `/api/v1/transports/${transportId}/status?branchId=${encodeURIComponent(branchId)}`,
    { toStatus, reason: reason ?? null }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to update status");
  }
  const json: ApiResponse<Transport> = await res.json();
  return json.data;
}

export async function updateTransportQuantities(
  patch: (path: string, body?: unknown) => Promise<Response>,
  transportId: string,
  branchId: string,
  items: { itemId: string; declared_qty?: number | null; unloaded_qty?: number | null }[]
): Promise<TransportDetail> {
  const res = await patch(
    `/api/v1/transports/${transportId}/quantities?branchId=${encodeURIComponent(branchId)}`,
    { items }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to update quantities");
  }
  const json: ApiResponse<TransportDetail> = await res.json();
  return json.data;
}

export async function setSuggestedDock(
  patch: (path: string, body?: unknown) => Promise<Response>,
  transportId: string,
  suggestedDockId: string | null,
  branchId: string
): Promise<unknown> {
  const res = await patch(
    `/api/v1/transports/${transportId}?branchId=${encodeURIComponent(branchId)}`,
    { suggested_dock_id: suggestedDockId }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to set suggested dock");
  }
  return (await res.json()).data;
}
