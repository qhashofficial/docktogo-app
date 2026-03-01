import { useEffect, useState } from 'react'
import {
  Truck,
  Search,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { getTransports } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import type { Transport, OperationalStatus } from '../../types'

const STATUS_FILTERS: (OperationalStatus | 'ALL')[] = [
  'ALL',
  'PLANNED',
  'ARRIVING',
  'WAITING',
  'IN_PROCESS',
  'PAUSED',
  'READY',
  'COMPLETED',
  'QUEUED',
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function TransportsPage() {
  const { activeBranch } = useBranch()
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OperationalStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!activeBranch) return
    setLoading(true)
    getTransports({
      branchId: activeBranch.id,
      operationalStatus: statusFilter === 'ALL' ? undefined : statusFilter,
    })
      .then((res) => setTransports(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeBranch, statusFilter])

  const filtered = transports.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.externalReference?.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.sourceSystem.toLowerCase().includes(q)
    )
  })

  if (!activeBranch) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-txt-dim text-sm">Select a branch to view transports</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transports..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-edge rounded-xl text-sm text-txt placeholder:text-txt-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-card border border-edge text-txt-dim hover:text-txt hover:border-edge-strong'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-edge p-16 text-center">
          <Truck className="w-10 h-10 text-txt-placeholder mx-auto mb-3" />
          <p className="text-txt-dim text-sm">No transports found</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-edge overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_110px_90px_100px_90px_80px] gap-4 px-6 py-3.5 border-b border-edge text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
            <span>Name</span>
            <span>Status</span>
            <span>Business</span>
            <span>Source</span>
            <span>Updated</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-edge">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_110px_90px_100px_90px_80px] gap-4 px-6 py-4 hover:bg-page/60 transition-colors cursor-pointer items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Truck className="w-4 h-4 text-txt-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-txt truncate">
                      {t.externalReference || 'No reference'}
                    </p>
                    <p className="text-[11px] text-txt-muted font-mono truncate">
                      {t.id.slice(0, 12)}
                    </p>
                  </div>
                </div>

                <StatusBadge kind="operational" status={t.operationalStatus} />

                <StatusBadge kind="business" status={t.businessStatus} />

                <span className="text-xs font-mono text-txt-dim">{t.sourceSystem}</span>

                <div className="flex items-center gap-1 text-xs text-txt-muted">
                  <Clock className="w-3 h-3" />
                  {timeAgo(t.updatedAt)}
                </div>

                <div className="text-right">
                  <button className="px-3 py-1 text-xs font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary/10 transition-colors">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
