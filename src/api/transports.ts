import { api } from './client'
import type { ApiResponse, Transport, TransportDetail, OperationalStatus, BusinessStatus } from '../types'

interface TransportFilters {
  branchId: string
  operationalStatus?: OperationalStatus
  businessStatus?: BusinessStatus
}

export function getTransports(filters: TransportFilters) {
  const params = new URLSearchParams({ branchId: filters.branchId })
  if (filters.operationalStatus) params.set('operationalStatus', filters.operationalStatus)
  if (filters.businessStatus) params.set('businessStatus', filters.businessStatus)
  return api<ApiResponse<Transport[]>>(`/api/v1/transports?${params}`)
}

export function getTransport(transportId: string, branchId: string) {
  return api<ApiResponse<TransportDetail>>(
    `/api/v1/transports/${transportId}?branchId=${branchId}`,
  )
}

export function updateTransportStatus(
  transportId: string,
  toStatus: OperationalStatus,
  branchId: string,
  reason?: string,
) {
  return api<ApiResponse<Transport>>(
    `/api/v1/transports/${transportId}/status?branchId=${branchId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ toStatus, reason }),
    },
  )
}

export function updateQuantities(
  transportId: string,
  items: { itemId: string; declared_qty?: number; unloaded_qty?: number }[],
  branchId: string,
) {
  return api<ApiResponse<Transport>>(
    `/api/v1/transports/${transportId}/quantities?branchId=${branchId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    },
  )
}

export function updateTransport(
  transportId: string,
  branchId: string,
  data: { suggested_dock_id?: string },
) {
  return api<ApiResponse<Transport>>(
    `/api/v1/transports/${transportId}?branchId=${branchId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export interface IngestPayload {
  branchId: string
  externalReference: string
  etaPlannedAt?: string
  businessStatus?: string
  items?: { referenceType: string; referenceValue: string; expectedQty?: number }[]
}

export function ingestTransport(payload: IngestPayload) {
  return api<ApiResponse<{ transportId: string; skipped?: boolean }>>(
    '/api/v1/transports/ingest',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}
