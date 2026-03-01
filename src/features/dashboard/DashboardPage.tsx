import { useEffect, useState } from 'react'
import {
  Container,
  Truck,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { getDocks } from '../../api/docks'
import { getTransports } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import type { Dock, Transport } from '../../types'
import { useNavigate } from 'react-router-dom'

interface StatCard {
  label: string
  value: string | number
  icon: typeof Truck
  iconBg: string
  iconColor: string
  change?: string
}

export default function DashboardPage() {
  const { activeBranch } = useBranch()
  const navigate = useNavigate()
  const [docks, setDocks] = useState<Dock[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)

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

  const activeTransports = transports.filter((t) => t.businessStatus === 'ACTIVE')
  const inProcess = activeTransports.filter((t) => t.operationalStatus === 'IN_PROCESS').length
  const completed = activeTransports.filter((t) => t.operationalStatus === 'COMPLETED').length
  const activeDocks = docks.filter((d) => d.status === 'OCCUPIED').length
  const recentTransports = [...transports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const stats: StatCard[] = [
    {
      label: 'Transports',
      value: activeTransports.length,
      icon: Truck,
      iconBg: 'bg-primary-soft',
      iconColor: 'text-primary',
      change: '+12.5%',
    },
    {
      label: 'Active Docks',
      value: activeDocks,
      icon: Container,
      iconBg: 'bg-success-soft',
      iconColor: 'text-success',
      change: `${docks.length} total`,
    },
    {
      label: 'In Process',
      value: inProcess,
      icon: Clock,
      iconBg: 'bg-warning-soft',
      iconColor: 'text-warning',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-status-completed',
      change: 'today',
    },
  ]

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
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card rounded-2xl border border-edge p-5 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.iconBg} mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="font-display text-3xl font-bold text-txt tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-8 bg-page rounded-lg animate-pulse" />
              ) : (
                stat.value
              )}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-txt-dim">{stat.label}</p>
              {stat.change && (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dock status */}
        <div className="bg-card rounded-2xl border border-edge p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-semibold text-txt">Dock Status</h2>
            <button
              onClick={() => navigate('/docks')}
              className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-page rounded-xl animate-pulse" />
              ))}
            </div>
          ) : docks.length === 0 ? (
            <div className="text-center py-10">
              <Container className="w-8 h-8 text-txt-placeholder mx-auto mb-2" />
              <p className="text-txt-muted text-sm">No docks configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docks.map((dock) => (
                <div
                  key={dock.id}
                  className="flex items-center justify-between px-4 py-3 bg-page rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Container className="w-4 h-4 text-txt-muted" />
                    <span className="text-sm font-medium text-txt">{dock.name}</span>
                  </div>
                  <StatusBadge kind="dock" status={dock.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transports */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-edge p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-semibold text-txt">Latest Transports</h2>
            <button
              onClick={() => navigate('/transports')}
              className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-page rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentTransports.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-txt-placeholder mx-auto mb-2" />
              <p className="text-txt-muted text-sm">No transports yet</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_110px_100px_100px] gap-4 px-4 py-2.5 text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
                <span>Transport</span>
                <span>Status</span>
                <span>Source</span>
                <span className="text-right">Updated</span>
              </div>

              {recentTransports.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate('/transports')}
                  className="grid grid-cols-[1fr_110px_100px_100px] gap-4 px-4 py-3 hover:bg-page rounded-xl transition-colors cursor-pointer items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Truck className="w-4 h-4 text-txt-muted shrink-0" />
                    <span className="text-sm font-medium text-txt truncate">
                      {t.externalReference || t.id.slice(0, 8)}
                    </span>
                  </div>
                  <StatusBadge kind="operational" status={t.operationalStatus} />
                  <span className="text-xs font-mono text-txt-dim">{t.sourceSystem}</span>
                  <span className="text-xs text-txt-muted text-right">
                    {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
