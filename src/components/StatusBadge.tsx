import type { OperationalStatus, DockStatus, BusinessStatus } from '../types'

const OP_STYLES: Record<OperationalStatus, string> = {
  PLANNED: 'bg-status-planned/10 text-status-planned',
  ARRIVING: 'bg-status-arriving/10 text-status-arriving',
  WAITING: 'bg-status-waiting/10 text-status-waiting',
  IN_PROCESS: 'bg-status-process/10 text-status-process',
  PAUSED: 'bg-status-paused/10 text-status-paused',
  READY: 'bg-status-ready/10 text-status-ready',
  COMPLETED: 'bg-status-completed/10 text-status-completed',
  QUEUED: 'bg-status-queued/10 text-status-queued',
}

const DOCK_STYLES: Record<DockStatus, string> = {
  AVAILABLE: 'bg-dock-available/10 text-dock-available',
  OCCUPIED: 'bg-dock-occupied/10 text-dock-occupied',
  BLOCKED_PENDING: 'bg-dock-pending/10 text-dock-pending',
  BLOCKED: 'bg-dock-blocked/10 text-dock-blocked',
}

const BIZ_STYLES: Record<BusinessStatus, string> = {
  ACTIVE: 'bg-success/10 text-success',
  CANCELED: 'bg-danger/10 text-danger',
}

type BadgeVariant =
  | { kind: 'operational'; status: OperationalStatus }
  | { kind: 'dock'; status: DockStatus }
  | { kind: 'business'; status: BusinessStatus }

export default function StatusBadge(props: BadgeVariant) {
  const style =
    props.kind === 'operational'
      ? OP_STYLES[props.status]
      : props.kind === 'dock'
        ? DOCK_STYLES[props.status]
        : BIZ_STYLES[props.status]

  const label = props.status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${style}`}>
      {label}
    </span>
  )
}
