import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  Clock,
  Package,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Ban,
  Save,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { getTransport, updateTransportStatus, updateQuantities } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import { SOURCE_LABELS, type TransportDetail, type OperationalStatus, type TransportItem } from '../../types'

const NEXT_STATUS: Partial<Record<OperationalStatus, OperationalStatus>> = {
  PLANNED: 'ARRIVING',
  ARRIVING: 'WAITING',
  WAITING: 'IN_PROCESS',
  IN_PROCESS: 'READY',
  PAUSED: 'IN_PROCESS',
  READY: 'COMPLETED',
}

export default function TransportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeBranch } = useBranch()
  const navigate = useNavigate()
  const [transport, setTransport] = useState<TransportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingQty, setEditingQty] = useState<Record<string, { declared_qty?: number; unloaded_qty?: number }>>({})

  useEffect(() => {
    if (!id || !activeBranch) return
    setLoading(true)
    getTransport(id, activeBranch.id)
      .then((r) => setTransport(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, activeBranch])

  const handleStatusChange = async (toStatus: OperationalStatus) => {
    if (!transport || !activeBranch) return
    setActionLoading(true)
    try {
      await updateTransportStatus(transport.id, toStatus, activeBranch.id)
      const r = await getTransport(transport.id, activeBranch.id)
      setTransport(r.data)
    } catch { /* */ }
    setActionLoading(false)
  }

  const handleCancel = async () => {
    if (!transport || !activeBranch) return
    setActionLoading(true)
    try {
      await updateTransportStatus(transport.id, 'COMPLETED' as OperationalStatus, activeBranch.id, 'Canceled by user')
      const r = await getTransport(transport.id, activeBranch.id)
      setTransport(r.data)
    } catch { /* */ }
    setActionLoading(false)
  }

  const handleSaveQuantities = async () => {
    if (!transport || !activeBranch) return
    const items = Object.entries(editingQty).map(([itemId, vals]) => ({ itemId, ...vals }))
    if (items.length === 0) return
    setActionLoading(true)
    try {
      await updateQuantities(transport.id, items, activeBranch.id)
      const r = await getTransport(transport.id, activeBranch.id)
      setTransport(r.data)
      setEditingQty({})
    } catch { /* */ }
    setActionLoading(false)
  }

  if (!activeBranch) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <AlertTriangle className="w-8 h-8 text-warning" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    )
  }

  if (!transport) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Truck className="w-10 h-10 text-txt-placeholder mx-auto mb-3" />
        <p className="text-txt-dim">Transport not found</p>
        <button onClick={() => navigate('/transports')} className="mt-4 text-primary text-sm font-medium">Back to list</button>
      </div>
    )
  }

  const nextStatus = NEXT_STATUS[transport.operational_status]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/transports')} className="p-2 rounded-xl hover:bg-page text-txt-muted hover:text-txt transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-txt">
            {transport.external_reference || transport.id.slice(0, 12)}
          </h1>
          <p className="text-sm text-txt-muted font-mono">{transport.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge kind="operational" status={transport.operational_status} />
          <StatusBadge kind="business" status={transport.business_status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="bg-card border border-edge rounded-2xl p-6">
            <h2 className="font-display text-base font-semibold text-txt mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-txt-muted">Source</span><p className="font-medium text-txt mt-0.5">{SOURCE_LABELS[transport.source_system] ?? transport.source_system}</p></div>
              <div><span className="text-txt-muted">ETA</span><p className="font-medium text-txt mt-0.5">{transport.eta_planned_at ? new Date(transport.eta_planned_at).toLocaleString() : '—'}</p></div>
              <div><span className="text-txt-muted">Assigned Dock</span><p className="font-medium text-txt mt-0.5 font-mono">{transport.assigned_dock_id?.slice(0, 8) || '—'}</p></div>
              <div><span className="text-txt-muted">Queue Position</span><p className="font-medium text-txt mt-0.5">{transport.queue_position ?? '—'}</p></div>
              <div><span className="text-txt-muted">Created</span><p className="font-medium text-txt mt-0.5">{new Date(transport.created_at).toLocaleString()}</p></div>
              <div><span className="text-txt-muted">Updated</span><p className="font-medium text-txt mt-0.5">{new Date(transport.updated_at).toLocaleString()}</p></div>
            </div>
          </div>

          {/* Actions */}
          {transport.business_status === 'ACTIVE' && transport.operational_status !== 'COMPLETED' && (
            <div className="bg-card border border-edge rounded-2xl p-6">
              <h2 className="font-display text-base font-semibold text-txt mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                {nextStatus && (
                  <button onClick={() => handleStatusChange(nextStatus)} disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark disabled:opacity-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                    Move to {nextStatus.replace(/_/g, ' ')}
                  </button>
                )}
                {transport.operational_status === 'IN_PROCESS' && (
                  <button onClick={() => handleStatusChange('PAUSED')} disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-warning-soft text-warning border border-warning/20 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                    Pause
                  </button>
                )}
                <button onClick={handleCancel} disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-danger-soft text-danger border border-danger/20 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                  <Ban className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-card border border-edge rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-txt flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Items ({transport.items?.length || 0})
              </h2>
              {Object.keys(editingQty).length > 0 && (
                <button onClick={handleSaveQuantities} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50">
                  <Save className="w-3 h-3" /> Save Quantities
                </button>
              )}
            </div>
            {!transport.items || transport.items.length === 0 ? (
              <p className="text-txt-muted text-sm py-4 text-center">No items</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-txt-muted uppercase tracking-wider border-b border-edge">
                      <th className="text-left py-2 font-semibold">Reference</th>
                      <th className="text-left py-2 font-semibold">Type</th>
                      <th className="text-right py-2 font-semibold">Expected</th>
                      <th className="text-right py-2 font-semibold">Declared</th>
                      <th className="text-right py-2 font-semibold">Unloaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {transport.items.map((item: TransportItem) => (
                      <tr key={item.id} className="hover:bg-page/50">
                        <td className="py-2.5 font-mono text-txt">{item.reference_value}</td>
                        <td className="py-2.5 text-txt-dim">{item.reference_type}</td>
                        <td className="py-2.5 text-right font-mono text-txt">{item.expected_qty ?? '—'}</td>
                        <td className="py-2.5 text-right">
                          <input type="number" defaultValue={item.declared_qty ?? ''}
                            onChange={(e) => setEditingQty((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], declared_qty: e.target.value ? Number(e.target.value) : undefined },
                            }))}
                            className="w-20 text-right bg-page border border-edge rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-primary" />
                        </td>
                        <td className="py-2.5 text-right">
                          <input type="number" defaultValue={item.unloaded_qty ?? ''}
                            onChange={(e) => setEditingQty((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], unloaded_qty: e.target.value ? Number(e.target.value) : undefined },
                            }))}
                            className="w-20 text-right bg-page border border-edge rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-primary" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: History */}
        <div className="space-y-6">
          <div className="bg-card border border-edge rounded-2xl p-6">
            <h2 className="font-display text-base font-semibold text-txt mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Status History
            </h2>
            {!transport.status_history || transport.status_history.length === 0 ? (
              <p className="text-txt-muted text-sm text-center py-4">No history</p>
            ) : (
              <div className="space-y-3">
                {transport.status_history.map((h, i) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                      {i < transport.status_history.length - 1 && <div className="w-px flex-1 bg-edge mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-txt">
                        {h.from_status ? `${h.from_status} → ` : ''}{h.to_status}
                      </p>
                      {h.reason && <p className="text-xs text-txt-dim mt-0.5">{h.reason}</p>}
                      <p className="text-[11px] text-txt-muted mt-0.5">
                        {new Date(h.created_at).toLocaleString()}
                        {h.changed_by_system ? ' · system' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Durations */}
          {transport.durations && Object.keys(transport.durations).length > 0 && (
            <div className="bg-card border border-edge rounded-2xl p-6">
              <h2 className="font-display text-base font-semibold text-txt mb-4">Durations</h2>
              <div className="space-y-2">
                {Object.entries(transport.durations).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-txt-dim">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-txt">{Math.round(val as number)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
