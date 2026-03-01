import { api } from './client'
import type { ApiResponse, Dock, DockAssignment, Transport } from '../types'

export function getDocks(branchId: string) {
  return api<ApiResponse<Dock[]>>(`/api/v1/docks?branchId=${branchId}`)
}

export function createDock(branchId: string, name: string) {
  return api<ApiResponse<Dock>>('/api/v1/docks', {
    method: 'POST',
    body: JSON.stringify({ branchId, name }),
  })
}

export function blockDock(dockId: string, block: boolean, branchId: string) {
  return api<ApiResponse<Dock>>(`/api/v1/docks/${dockId}/block?branchId=${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify({ block }),
  })
}

export function suggestDock(dockId: string, transportId: string, branchId: string) {
  return api<ApiResponse<Transport>>(`/api/v1/docks/${dockId}/suggest?branchId=${branchId}`, {
    method: 'POST',
    body: JSON.stringify({ transportId }),
  })
}

export function assignDock(
  dockId: string,
  transportId: string,
  branchId: string,
  queueIfOccupied?: boolean,
) {
  return api<ApiResponse<{ dock: Dock; assignment: DockAssignment }>>(
    `/api/v1/docks/${dockId}/assign?branchId=${branchId}`,
    {
      method: 'POST',
      body: JSON.stringify({ transportId, queueIfOccupied }),
    },
  )
}

export function getDockQueue(dockId: string) {
  return api<ApiResponse<DockAssignment[]>>(`/api/v1/docks/${dockId}/queue`)
}

export function reorderQueue(
  dockId: string,
  positions: { transportId: string; position: number }[],
  branchId: string,
) {
  return api<ApiResponse<DockAssignment[]>>(
    `/api/v1/docks/${dockId}/queue?branchId=${branchId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ positions }),
    },
  )
}

export function promoteNext(dockId: string, branchId: string) {
  return api<ApiResponse<{ dock: Dock; promotedTransportId: string }>>(
    `/api/v1/docks/${dockId}/promote-next?branchId=${branchId}`,
    { method: 'POST' },
  )
}
