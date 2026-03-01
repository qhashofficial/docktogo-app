import { useEffect, useState, useMemo } from 'react'
import {
  Container,
  Truck,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Users,
  TrendingUp,
  Zap,
  CalendarClock,
  Timer,
  BarChart3,
  Activity,
  ArrowDownRight,
  Signal,
  Gauge,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { useAuth } from '../../context/AuthContext'
import { getDocks } from '../../api/docks'
import { getTransports } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import { SOURCE_LABELS, type Dock, type Transport } from '../../types'
import { useNavigate } from 'react-router-dom'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-[2px] h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full ${color} transition-all duration-500`}
          style={{
            height: `${Math.max((v / max) * 100, 8)}%`,
            opacity: 0.4 + (i / values.length) * 0.6,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}

function ProgressRing({ percent, size = 44, stroke = 4, color }: { percent: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-edge" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-status-planned',
  ARRIVING: 'bg-status-arriving',
  WAITING: 'bg-status-waiting',
  IN_PROCESS: 'bg-status-process',
  PAUSED: 'bg-status-paused',
  READY: 'bg-status-ready',
  COMPLETED: 'bg-status-completed',
  QUEUED: 'bg-status-queued',
}

export default function DashboardPage() {
  const { activeBranch } = useBranch()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docks, setDocks] = useState<Dock[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!activeBranch) return
    setLoading(true)
    Promise.all([
      getDocks(activeBranch.id).then((r) => setDocks(r.data)),
      getTransports({ branchId: activeBranch.id }).then((r) => setTransports(r.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeBranch])

  const activeTransports = transports.filter((t) => t.business_status === 'ACTIVE')
  const inProcess = activeTransports.filter((t) => t.operational_status === 'IN_PROCESS').length
  const completed = activeTransports.filter((t) => t.operational_status === 'COMPLETED').length
  const waiting = activeTransports.filter((t) => t.operational_status === 'WAITING').length
  const planned = activeTransports.filter((t) => t.operational_status === 'PLANNED').length
  const activeDocks = docks.filter((d) => d.status === 'OCCUPIED').length
  const blockedDocks = docks.filter((d) => d.status === 'BLOCKED' || d.status === 'BLOCKED_PENDING').length
  const dockUtilization = docks.length > 0 ? Math.round((activeDocks / docks.length) * 100) : 0

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of activeTransports) {
      counts[t.operational_status] = (counts[t.operational_status] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [activeTransports])

  const totalStatusCount = activeTransports.length || 1

  const recentTransports = [...transports]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8)

  const sparkData = [3, 5, 2, 8, 6, 9, 4, 7, 10, 6, 8, 5]

  const upcomingETA = activeTransports
    .filter((t) => t.eta_planned_at && new Date(t.eta_planned_at) > now && t.operational_status !== 'COMPLETED')
    .sort((a, b) => new Date(a.eta_planned_at!).getTime() - new Date(b.eta_planned_at!).getTime())
    .slice(0, 4)

  if (!activeBranch) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-txt-dim text-sm">Select a branch to view dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">
              {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h2 className="font-display text-2xl font-bold">
              {getGreeting()}, {user?.displayName || user?.email?.split('@')[0]}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {activeBranch.name} — {activeTransports.length} active transports · {docks.length} docks online
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <div className="relative">
                <ProgressRing percent={dockUtilization} size={56} stroke={4} color="#34D399" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{dockUtilization}%</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1">Dock Usage</p>
            </div>
            <div className="text-center px-4 border-l border-white/10">
              <p className="font-display text-2xl font-bold">{inProcess}</p>
              <p className="text-[10px] text-white/50">In Process</p>
            </div>
            <div className="text-center px-4 border-l border-white/10">
              <p className="font-display text-2xl font-bold text-emerald-300">{completed}</p>
              <p className="text-[10px] text-white/50">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button onClick={() => navigate('/transports')}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-edge rounded-xl text-sm font-medium text-txt hover:border-primary hover:text-primary hover:shadow-sm transition-all shrink-0 group">
          <Truck className="w-4 h-4 text-txt-muted group-hover:text-primary transition-colors" />
          View Transports
        </button>
        <button onClick={() => navigate('/docks')}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-edge rounded-xl text-sm font-medium text-txt hover:border-accent hover:text-accent hover:shadow-sm transition-all shrink-0 group">
          <Container className="w-4 h-4 text-txt-muted group-hover:text-accent transition-colors" />
          Manage Docks
        </button>
        <button onClick={() => navigate('/branches')}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-edge rounded-xl text-sm font-medium text-txt hover:border-primary hover:text-primary hover:shadow-sm transition-all shrink-0 group">
          <Signal className="w-4 h-4 text-txt-muted group-hover:text-primary transition-colors" />
          Branches
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Transports', value: activeTransports.length, icon: Truck, color: 'text-primary', bg: 'bg-primary-soft', trend: '+12%', up: true },
          { label: 'Active Docks', value: activeDocks, icon: Container, color: 'text-accent', bg: 'bg-accent-soft', trend: `${docks.length} total`, up: true },
          { label: 'In Process', value: inProcess, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50', trend: null, up: true },
          { label: 'Waiting', value: waiting, icon: Clock, color: 'text-warning', bg: 'bg-warning-soft', trend: null, up: false },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-accent-dark', bg: 'bg-accent-soft', trend: 'today', up: true },
          { label: 'Blocked', value: blockedDocks, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger-soft', trend: null, up: false },
        ].map((stat, i) => (
          <div key={stat.label}
            className="bg-card rounded-2xl border border-edge p-4 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {stat.trend && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${stat.up ? 'text-accent' : 'text-danger'}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="font-display text-2xl font-bold text-txt tracking-tight animate-count-up">
              {loading ? <span className="inline-block w-10 h-7 bg-page rounded-lg animate-pulse" /> : stat.value}
            </p>
            <p className="text-[11px] text-txt-dim mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Status Distribution */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-edge p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm font-semibold text-txt">Status Distribution</h2>
            </div>
            <span className="text-[10px] text-txt-muted font-mono">{activeTransports.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-page rounded-lg animate-pulse" />)}
            </div>
          ) : statusDistribution.length === 0 ? (
            <p className="text-sm text-txt-muted text-center py-8">No data</p>
          ) : (
            <div className="space-y-3">
              {statusDistribution.map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-txt-dim">{status.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-bold text-txt">{count}</span>
                  </div>
                  <div className="h-2 bg-page rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_COLORS[status] || 'bg-primary'} transition-all duration-1000 ease-out`}
                      style={{ width: `${(count / totalStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini sparkline */}
          <div className="mt-6 pt-4 border-t border-edge">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-txt-muted flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Activity Trend
              </span>
              <span className="text-[10px] text-txt-placeholder">Last 12h</span>
            </div>
            <MiniBar values={sparkData} color="bg-primary" />
          </div>
        </div>

        {/* Dock Overview */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-edge p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent" />
              <h2 className="font-display text-sm font-semibold text-txt">Dock Overview</h2>
            </div>
            <button onClick={() => navigate('/docks')}
              className="text-[10px] text-primary hover:text-primary-dark font-medium flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Utilization ring */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <ProgressRing percent={dockUtilization} size={100} stroke={8} color="var(--color-accent)" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-bold text-txt">{dockUtilization}%</span>
                <span className="text-[9px] text-txt-muted">utilization</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-page rounded-xl animate-pulse" />)}
            </div>
          ) : docks.length === 0 ? (
            <div className="text-center py-4">
              <Container className="w-6 h-6 text-txt-placeholder mx-auto mb-2" />
              <p className="text-txt-muted text-xs">No docks configured</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {docks.slice(0, 5).map((dock) => (
                <div key={dock.id} className="flex items-center justify-between px-3 py-2 bg-page rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${
                      dock.status === 'AVAILABLE' ? 'bg-accent animate-pulse-dot' :
                      dock.status === 'OCCUPIED' ? 'bg-primary' :
                      dock.status === 'BLOCKED' ? 'bg-danger' : 'bg-warning'
                    }`} />
                    <span className="text-xs font-medium text-txt">{dock.name}</span>
                  </div>
                  <StatusBadge kind="dock" status={dock.status} />
                </div>
              ))}
              {docks.length > 5 && (
                <p className="text-[10px] text-txt-muted text-center pt-1">+{docks.length - 5} more</p>
              )}
            </div>
          )}

          {/* Dock stats summary */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-edge">
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{docks.filter(d => d.status === 'AVAILABLE').length}</p>
              <p className="text-[9px] text-txt-muted">Available</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{activeDocks}</p>
              <p className="text-[9px] text-txt-muted">Occupied</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-danger">{blockedDocks}</p>
              <p className="text-[9px] text-txt-muted">Blocked</p>
            </div>
          </div>
        </div>

        {/* Upcoming ETA */}
        <div className="lg:col-span-5 bg-card rounded-2xl border border-edge p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm font-semibold text-txt">Upcoming Arrivals</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-accent font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
              Live
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-page rounded-xl animate-pulse" />)}
            </div>
          ) : upcomingETA.length === 0 ? (
            <div className="text-center py-10">
              <Timer className="w-8 h-8 text-txt-placeholder mx-auto mb-2 animate-float" />
              <p className="text-txt-muted text-sm">No upcoming arrivals</p>
              <p className="text-txt-placeholder text-xs mt-1">Transports with ETAs will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingETA.map((t, i) => {
                const eta = new Date(t.eta_planned_at!)
                const minsUntil = Math.max(0, Math.round((eta.getTime() - now.getTime()) / 60000))
                const hoursUntil = Math.floor(minsUntil / 60)
                const isUrgent = minsUntil < 30
                return (
                  <div key={t.id}
                    onClick={() => navigate(`/transports/${t.id}`)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                      isUrgent ? 'bg-danger-soft border border-danger/10' : 'bg-page hover:bg-primary-soft/40'
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isUrgent ? 'bg-danger/10' : 'bg-primary-soft'
                    }`}>
                      <Truck className={`w-5 h-5 ${isUrgent ? 'text-danger' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-txt truncate">
                        {t.external_reference || t.id.slice(0, 8)}
                      </p>
                      <p className="text-[11px] text-txt-muted">
                        ETA: {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {SOURCE_LABELS[t.source_system] ?? t.source_system}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isUrgent ? 'text-danger' : 'text-primary'}`}>
                        {hoursUntil > 0 ? `${hoursUntil}h ${minsUntil % 60}m` : `${minsUntil}m`}
                      </p>
                      <p className="text-[9px] text-txt-muted">remaining</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-edge p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              <h2 className="font-display text-sm font-semibold text-txt">Recent Activity</h2>
            </div>
            <button onClick={() => navigate('/transports')}
              className="text-[10px] text-primary hover:text-primary-dark font-medium flex items-center gap-0.5">
              All transports <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-page rounded-xl animate-pulse" />)}
            </div>
          ) : recentTransports.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-txt-placeholder mx-auto mb-2" />
              <p className="text-txt-muted text-sm">No transports yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-edge" />
              <div className="space-y-1">
                {recentTransports.map((t, i) => (
                  <div key={t.id}
                    onClick={() => navigate(`/transports/${t.id}`)}
                    className="relative flex items-center gap-4 px-4 py-3 hover:bg-page rounded-xl transition-all cursor-pointer group animate-slide-right"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`w-2.5 h-2.5 rounded-full z-10 ring-4 ring-card ${
                      t.operational_status === 'COMPLETED' ? 'bg-accent' :
                      t.operational_status === 'IN_PROCESS' ? 'bg-primary' :
                      t.operational_status === 'WAITING' ? 'bg-warning' : 'bg-edge-strong'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-txt truncate group-hover:text-primary transition-colors">
                          {t.external_reference || t.id.slice(0, 8)}
                        </span>
                        <StatusBadge kind="operational" status={t.operational_status} />
                      </div>
                      <p className="text-[11px] text-txt-muted mt-0.5">
                        {SOURCE_LABELS[t.source_system] ?? t.source_system} · {timeAgo(t.updated_at)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-txt-placeholder opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* System Health / Summary Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Branch Info */}
          <div className="bg-card rounded-2xl border border-edge p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
                <Signal className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-txt">{activeBranch.name}</p>
                <p className="text-[11px] text-txt-muted font-mono">{activeBranch.code}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-page rounded-xl px-3 py-2.5 text-center">
                <p className="font-display text-lg font-bold text-txt">{docks.length}</p>
                <p className="text-[10px] text-txt-muted">Docks</p>
              </div>
              <div className="bg-page rounded-xl px-3 py-2.5 text-center">
                <p className="font-display text-lg font-bold text-txt">{transports.length}</p>
                <p className="text-[10px] text-txt-muted">Transports</p>
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl border border-accent/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-txt">Today's Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-dim">Throughput</span>
                <span className="text-xs font-bold text-accent">{completed} completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-dim">Planned</span>
                <span className="text-xs font-bold text-primary">{planned} incoming</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-dim">Queue</span>
                <span className="text-xs font-bold text-warning">{waiting} waiting</span>
              </div>
              <div className="h-px bg-edge" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-dim font-medium">Efficiency</span>
                <span className="text-sm font-bold text-accent">
                  {activeTransports.length > 0 ? Math.round((completed / activeTransports.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Live Clock */}
          <div className="bg-card rounded-2xl border border-edge p-4 text-center">
            <p className="font-display text-3xl font-bold text-txt tracking-tight tabular-nums">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[11px] text-txt-muted mt-1">
              {now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
              <span className="text-[10px] text-accent font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
