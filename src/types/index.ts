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
  is_active: boolean
  created_at: string
}

export type DockStatus = 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED_PENDING' | 'BLOCKED'

export interface Dock {
  id: string
  branch_id: string
  name: string
  status: DockStatus
  created_at: string
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

export const SOURCE_LABELS: Record<string, string> = {
  PLANNING: 'Partner (Planning)',
  manual: 'Internal',
}

export interface Transport {
  id: string
  branch_id: string
  source_system: 'PLANNING' | 'manual'
  external_reference: string | null
  operational_status: OperationalStatus
  business_status: BusinessStatus
  assigned_dock_id: string | null
  suggested_dock_id: string | null
  queue_position: number | null
  eta_planned_at: string | null
  arrived_at: string | null
  waiting_at: string | null
  in_process_at: string | null
  ready_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TransportItem {
  id: string
  transport_id: string
  reference_type: 'CMR' | 'ORDER' | 'OTHER'
  reference_value: string
  expected_qty: number | null
  declared_qty: number | null
  unloaded_qty: number | null
  comment: string | null
  is_active: boolean
}

export interface StatusHistoryEntry {
  id: string
  transport_id: string
  from_status: string | null
  to_status: string
  changed_by_user_id: string | null
  changed_by_system: boolean
  reason: string | null
  created_at: string
}

export interface TransportDetail extends Transport {
  items: TransportItem[]
  status_history: StatusHistoryEntry[]
  durations: Record<string, number>
}

export interface DockAssignment {
  id: string
  dock_id: string
  transport_id: string
  mode: 'ASSIGNED' | 'QUEUED'
  position: number | null
  created_at: string
  ended_at: string | null
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
