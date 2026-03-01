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
