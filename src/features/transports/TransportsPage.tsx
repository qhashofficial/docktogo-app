import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  Search,
  AlertTriangle,
  Loader2,
  Clock,
  Plus,
  X,
  Package,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { useAuth } from '../../context/AuthContext'
import { getTransports, ingestTransport, type IngestPayload } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import { SOURCE_LABELS, type Transport, type OperationalStatus } from '../../types'

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
  const navigate = useNavigate()
  const { activeBranch } = useBranch()
  const { permissions } = useAuth()
  const canIngest = permissions.includes('office_operations') || permissions.includes('manage_team')
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OperationalStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [showIngest, setShowIngest] = useState(false)

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
      t.external_reference?.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.source_system.toLowerCase().includes(q)
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
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

        {canIngest && (
          <button onClick={() => setShowIngest(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            Ingest
          </button>
        )}
      </div>

      {/* Ingest Modal */}
      {showIngest && <IngestModal branchId={activeBranch.id} onClose={() => setShowIngest(false)} onCreated={() => {
        setShowIngest(false)
        setStatusFilter('ALL')
        setLoading(true)
        getTransports({ branchId: activeBranch.id })
          .then((res) => setTransports(res.data))
          .catch(() => {})
          .finally(() => setLoading(false))
      }} />}

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
                onClick={() => navigate(`/transports/${t.id}`)}
                className="grid grid-cols-[1fr_110px_90px_100px_90px_80px] gap-4 px-6 py-4 hover:bg-page/60 transition-colors cursor-pointer items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Truck className="w-4 h-4 text-txt-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-txt truncate">
                      {t.external_reference || 'No reference'}
                    </p>
                    <p className="text-[11px] text-txt-muted font-mono truncate">
                      {t.id.slice(0, 12)}
                    </p>
                  </div>
                </div>

                <StatusBadge kind="operational" status={t.operational_status} />
                <StatusBadge kind="business" status={t.business_status} />

                <span className="text-xs font-mono text-txt-dim">{SOURCE_LABELS[t.source_system] ?? t.source_system}</span>

                <div className="flex items-center gap-1 text-xs text-txt-muted">
                  <Clock className="w-3 h-3" />
                  {timeAgo(t.updated_at)}
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

/* ─── Ingest Modal ─── */

function IngestModal({ branchId, onClose, onCreated }: { branchId: string; onClose: () => void; onCreated: () => void }) {
  const [extRef, setExtRef] = useState('')
  const [eta, setEta] = useState('')
  const [items, setItems] = useState([{ referenceType: 'CMR' as const, referenceValue: '', expectedQty: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addItem = () => setItems([...items, { referenceType: 'CMR', referenceValue: '', expectedQty: '' }])

  const updateItem = (i: number, field: string, val: string) => {
    setItems(items.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }

  const removeItem = (i: number) => {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload: IngestPayload = {
        branchId,
        externalReference: extRef,
        etaPlannedAt: eta || undefined,
        items: items
          .filter((it) => it.referenceValue.trim())
          .map((it) => ({
            referenceType: it.referenceType,
            referenceValue: it.referenceValue,
            expectedQty: it.expectedQty ? Number(it.expectedQty) : undefined,
          })),
      }
      await ingestTransport(payload)
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ingest failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-edge shadow-xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-txt">Ingest Transport</h2>
          <button onClick={onClose} className="p-1 text-txt-muted hover:text-txt">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-txt mb-1.5">External Reference</label>
            <input value={extRef} onChange={(e) => setExtRef(e.target.value)} required
              className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="e.g. TR-2024-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-txt mb-1.5">ETA</label>
            <input type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)}
              className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-txt flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" /> Items
              </label>
              <button type="button" onClick={addItem} className="text-xs text-primary font-medium hover:text-primary-dark">+ Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={item.referenceType} onChange={(e) => updateItem(i, 'referenceType', e.target.value)}
                    className="bg-page border border-edge rounded-lg px-2 py-2 text-sm text-txt focus:outline-none focus:border-primary">
                    <option value="CMR">CMR</option>
                    <option value="ORDER">ORDER</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                  <input value={item.referenceValue} onChange={(e) => updateItem(i, 'referenceValue', e.target.value)}
                    className="flex-1 bg-page border border-edge rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:border-primary"
                    placeholder="Reference value" />
                  <input type="number" value={item.expectedQty} onChange={(e) => updateItem(i, 'expectedQty', e.target.value)}
                    className="w-20 bg-page border border-edge rounded-lg px-2 py-2 text-sm text-txt text-right focus:outline-none focus:border-primary"
                    placeholder="Qty" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-1 text-txt-muted hover:text-danger">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-page border border-edge rounded-xl text-sm font-medium text-txt-dim hover:text-txt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ingest
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
