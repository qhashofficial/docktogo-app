import { useEffect, useState } from 'react'
import {
  Truck,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { getTransports } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import type { Transport, OperationalStatus } from '../../types'

const OP_STATUS_OPTIONS: (OperationalStatus | 'ALL')[] = [
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center animate-fade-in">
          <AlertTriangle className="w-8 h-8 text-brand mx-auto mb-3" />
          <p className="text-txt-dim text-sm">Select a branch to view transports</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-txt uppercase">
          Transports
        </h1>
        <p className="text-txt-dim text-sm mt-1">
          {filtered.length} transport{filtered.length !== 1 ? 's' : ''} in{' '}
          <span className="text-brand font-medium">{activeBranch.name}</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-panel border border-edge rounded-xl text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-txt-muted shrink-0" />
          {OP_STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-brand/15 text-brand border border-brand/30'
                  : 'bg-raised border border-edge text-txt-dim hover:text-txt hover:border-edge-bright'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transport list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-txt-muted">
          <Truck className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No transports found</p>
        </div>
      ) : (
        <div className="bg-panel border border-edge rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_100px_120px_100px_80px] gap-4 px-5 py-3 border-b border-edge text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
            <span>Transport</span>
            <span>Status</span>
            <span>Business</span>
            <span>Source</span>
            <span>Updated</span>
            <span className="text-right">Dock</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-edge">
            {filtered.map((t, i) => (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_120px_100px_120px_100px_80px] gap-4 px-5 py-3.5 hover:bg-raised/50 transition-colors cursor-pointer group items-center"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Reference */}
                <div className="flex items-center gap-3 min-w-0">
                  <Truck className="w-4 h-4 text-txt-muted shrink-0 group-hover:text-brand transition-colors" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-txt truncate">
                      {t.externalReference || 'No reference'}
                    </p>
                    <p className="text-[11px] text-txt-muted font-mono truncate">{t.id.slice(0, 12)}...</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                {/* Status */}
                <div>
                  <StatusBadge kind="operational" status={t.operationalStatus} />
                </div>

                {/* Business status */}
                <div>
                  <StatusBadge kind="business" status={t.businessStatus} />
                </div>

                {/* Source */}
                <div>
                  <span className="text-xs font-mono text-txt-dim bg-raised px-2 py-1 rounded">
                    {t.sourceSystem}
                  </span>
                </div>

                {/* Updated */}
                <div className="flex items-center gap-1.5 text-xs text-txt-muted">
                  <Clock className="w-3 h-3" />
                  {timeAgo(t.updatedAt)}
                </div>

                {/* Dock */}
                <div className="text-right">
                  {t.assignedDockId ? (
                    <span className="text-xs font-mono text-brand bg-brand/10 px-2 py-1 rounded">
                      assigned
                    </span>
                  ) : t.suggestedDockId ? (
                    <span className="text-xs font-mono text-status-waiting bg-status-waiting/10 px-2 py-1 rounded">
                      suggested
                    </span>
                  ) : (
                    <span className="text-xs text-txt-muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
