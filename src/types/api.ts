export type ApiResponse<T> = { status: "ok" | "success"; data: T; message?: string };

export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  roleType: number;
  destinationId: string | null;
  isActive: boolean;
  lastLogin: string | null;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
};

export type DockStatus = "AVAILABLE" | "OCCUPIED" | "BLOCKED" | "BLOCKED_PENDING";
export type Dock = {
  id: string;
  branch_id: string;
  name: string;
  status: DockStatus;
  created_at: string;
};

export type TransportOperationalStatus =
  | "PLANNED" | "ARRIVING" | "WAITING" | "QUEUED" | "IN_PROCESS" | "PAUSED" | "READY" | "COMPLETED";
export type TransportBusinessStatus = "ACTIVE" | "CANCELED";
export type Transport = {
  id: string;
  branch_id: string;
  source_system: string;
  external_reference: string;
  operational_status: TransportOperationalStatus;
  business_status: TransportBusinessStatus;
  assigned_dock_id: string | null;
  suggested_dock_id: string | null;
  queue_position: number | null;
  eta_planned_at: string | null;
  arrived_at: string | null;
  waiting_at: string | null;
  in_process_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TransportStatusHistoryEntry = {
  id: string;
  from_status: string;
  to_status: string;
  changed_by_user_id: string | null;
  changed_by_system: string | null;
  reason: string | null;
  created_at: string;
};

export type TransportItem = {
  id: string;
  reference_type: string;
  reference_value: string;
  expected_qty: number | null;
  declared_qty: number | null;
  unloaded_qty: number | null;
  comment: string | null;
  is_active: boolean;
  updated_at: string;
};

export type TransportDetail = Transport & {
  status_history: TransportStatusHistoryEntry[];
  items: TransportItem[];
  durations?: Record<string, number | null>;
};

export type DockQueueEntry = {
  id: string;
  dock_id: string;
  transport_id: string;
  mode: string;
  position: number;
  created_at: string;
};
