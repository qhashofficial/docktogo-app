import { useEffect, useState } from 'react'
import { Container, Truck, Clock, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react'
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
  accent: string
  sub?: string
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

  const availableDocks = docks.filter((d) => d.status === 'AVAILABLE').length
  const activeDocks = docks.filter((d) => d.status === 'OCCUPIED').length
  const activeTransports = transports.filter((t) => t.businessStatus === 'ACTIVE')
  const inProcess = activeTransports.filter((t) => t.operationalStatus === 'IN_PROCESS').length
  const waiting = activeTransports.filter((t) => t.operationalStatus === 'WAITING').length
  const completed = activeTransports.filter((t) => t.operationalStatus === 'COMPLETED').length
  const recentTransports = [...transports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)

  const stats: StatCard[] = [
    {
      label: 'Total Transports',
      value: activeTransports.length,
      icon: Truck,
      accent: 'text-status-planned',
      sub: `${waiting} waiting`,
    },
    {
      label: 'Docks Active',
      value: `${activeDocks} / ${docks.length}`,
      icon: Container,
      accent: 'text-brand',
      sub: `${availableDocks} available`,
    },
    {
      label: 'In Process',
      value: inProcess,
      icon: Clock,
      accent: 'text-status-process',
      sub: 'currently unloading',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      accent: 'text-status-completed',
      sub: 'today',
    },
  ]

  if (!activeBranch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center animate-fade-in">
          <AlertTriangle className="w-8 h-8 text-brand mx-auto mb-3" />
          <p className="text-txt-dim text-sm">Select a branch to view dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-txt uppercase">
          Dashboard
        </h1>
        <p className="text-txt-dim text-sm mt-1">
          Overview for <span className="text-brand font-medium">{activeBranch.name}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-panel border border-edge rounded-xl p-5 hover:border-edge-bright transition-colors group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-medium text-txt-dim uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={`w-5 h-5 ${stat.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="font-display text-4xl font-bold text-txt tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-9 bg-raised rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </p>
            {stat.sub && (
              <p className="text-xs text-txt-muted mt-1.5">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dock status overview */}
        <div className="lg:col-span-1 bg-panel border border-edge rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-txt uppercase tracking-wide">
              Dock Status
            </h2>
            <button
              onClick={() => navigate('/docks')}
              className="text-xs text-brand hover:text-brand-light transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-raised rounded-lg animate-pulse" />
              ))}
            </div>
          ) : docks.length === 0 ? (
            <p className="text-txt-muted text-sm py-8 text-center">No docks configured</p>
          ) : (
            <div className="space-y-2">
              {docks.map((dock) => (
                <div
                  key={dock.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-raised rounded-lg border border-transparent hover:border-edge transition-colors"
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
        <div className="lg:col-span-2 bg-panel border border-edge rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-txt uppercase tracking-wide">
              Recent Transports
            </h2>
            <button
              onClick={() => navigate('/transports')}
              className="text-xs text-brand hover:text-brand-light transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-raised rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentTransports.length === 0 ? (
            <p className="text-txt-muted text-sm py-8 text-center">No transports yet</p>
          ) : (
            <div className="space-y-1.5">
              {recentTransports.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-3 bg-raised rounded-lg border border-transparent hover:border-edge transition-colors cursor-pointer group"
                  onClick={() => navigate('/transports')}
                >
                  <div className="flex items-center gap-4">
                    <Truck className="w-4 h-4 text-txt-muted group-hover:text-brand transition-colors" />
                    <div>
                      <p className="text-sm font-medium text-txt">
                        {t.externalReference || t.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-txt-muted font-mono">
                        {t.sourceSystem} · {new Date(t.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge kind="operational" status={t.operationalStatus} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
