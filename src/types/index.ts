export interface User {
  id: string
  email: string
  displayName: string | null
  roleType: number
  destinationId: string | null
  isActive: boolean
  lastLogin: string | null
}

export interface AuthData {
  access_token: string
  profile: User
  permissions: string[]
}

export interface Branch {
  id: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
}

export type DockStatus = 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED_PENDING' | 'BLOCKED'

export interface Dock {
  id: string
  branchId: string
  name: string
  status: DockStatus
  createdAt: string
}

export type OperationalStatus =
  | 'PLANNED'
  | 'ARRIVING'
  | 'WAITING'
  | 'IN_PROCESS'
  | 'PAUSED'
  | 'READY'
  | 'COMPLETED'
  | 'QUEUED'

export type BusinessStatus = 'ACTIVE' | 'CANCELED'

export interface Transport {
  id: string
  branchId: string
  sourceSystem: 'PLANNING' | 'manual'
  externalReference: string | null
  operationalStatus: OperationalStatus
  businessStatus: BusinessStatus
  assignedDockId: string | null
  suggestedDockId: string | null
  queuePosition: number | null
  etaPlannedAt: string | null
  arrivedAt: string | null
  waitingAt: string | null
  inProcessAt: string | null
  readyAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TransportItem {
  id: string
  transportId: string
  referenceType: 'CMR' | 'ORDER' | 'OTHER'
  referenceValue: string
  expectedQty: number | null
  declaredQty: number | null
  unloadedQty: number | null
  comment: string | null
  isActive: boolean
}

export interface StatusHistoryEntry {
  id: string
  transportId: string
  fromStatus: string | null
  toStatus: string
  changedByUserId: string | null
  changedBySystem: boolean
  reason: string | null
  createdAt: string
}

export interface TransportDetail extends Transport {
  items: TransportItem[]
  history: StatusHistoryEntry[]
  durations: Record<string, number>
}

export interface DockAssignment {
  id: string
  dockId: string
  transportId: string
  mode: 'ASSIGNED' | 'QUEUED'
  position: number | null
  createdAt: string
  endedAt: string | null
}

export interface ApiResponse<T> {
  status: string
  data: T
}

export const ROLE_LABELS: Record<number, string> = {
  1: 'Viewer',
  3: 'Warehouse Worker',
  5: 'Office Worker',
  7: 'Team Leader',
  8: 'Global Admin',
  9: 'Global Viewer',
  12: 'DEV',
}

export const OP_STATUS_FLOW: OperationalStatus[] = [
  'PLANNED',
  'ARRIVING',
  'WAITING',
  'IN_PROCESS',
  'PAUSED',
  'READY',
  'COMPLETED',
]
