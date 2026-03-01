import type { OperationalStatus, DockStatus, BusinessStatus } from '../types'

const OP_COLORS: Record<OperationalStatus, { bg: string; text: string; dot: string }> = {
  PLANNED: { bg: 'bg-status-planned/15', text: 'text-status-planned', dot: 'bg-status-planned' },
  ARRIVING: { bg: 'bg-status-arriving/15', text: 'text-status-arriving', dot: 'bg-status-arriving' },
  WAITING: { bg: 'bg-status-waiting/15', text: 'text-status-waiting', dot: 'bg-status-waiting' },
  IN_PROCESS: { bg: 'bg-status-process/15', text: 'text-status-process', dot: 'bg-status-process' },
  PAUSED: { bg: 'bg-status-paused/15', text: 'text-status-paused', dot: 'bg-status-paused' },
  READY: { bg: 'bg-status-ready/15', text: 'text-status-ready', dot: 'bg-status-ready' },
  COMPLETED: { bg: 'bg-status-completed/15', text: 'text-status-completed', dot: 'bg-status-completed' },
  QUEUED: { bg: 'bg-status-queued/15', text: 'text-status-queued', dot: 'bg-status-queued' },
}

const DOCK_COLORS: Record<DockStatus, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: 'bg-dock-available/15', text: 'text-dock-available', dot: 'bg-dock-available' },
  OCCUPIED: { bg: 'bg-dock-occupied/15', text: 'text-dock-occupied', dot: 'bg-dock-occupied' },
  BLOCKED_PENDING: { bg: 'bg-dock-pending/15', text: 'text-dock-pending', dot: 'bg-dock-pending' },
  BLOCKED: { bg: 'bg-dock-blocked/15', text: 'text-dock-blocked', dot: 'bg-dock-blocked' },
}

const BIZ_COLORS: Record<BusinessStatus, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: 'bg-dock-available/15', text: 'text-dock-available', dot: 'bg-dock-available' },
  CANCELED: { bg: 'bg-status-canceled/15', text: 'text-status-canceled', dot: 'bg-status-canceled' },
}

type BadgeVariant =
  | { kind: 'operational'; status: OperationalStatus }
  | { kind: 'dock'; status: DockStatus }
  | { kind: 'business'; status: BusinessStatus }

export default function StatusBadge(props: BadgeVariant) {
  const colors =
    props.kind === 'operational'
      ? OP_COLORS[props.status]
      : props.kind === 'dock'
        ? DOCK_COLORS[props.status]
        : BIZ_COLORS[props.status]

  const label = props.status.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono tracking-wide ${colors.bg} ${colors.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}
