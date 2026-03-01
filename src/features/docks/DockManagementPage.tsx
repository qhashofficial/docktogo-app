import { useEffect, useState, useCallback, type FormEvent } from 'react'
import {
  Container,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Truck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  X,
  ArrowRightCircle,
  Lightbulb,
  Gauge,
  Zap,
  BarChart3,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { useAuth } from '../../context/AuthContext'
import * as docksApi from '../../api/docks'
import { getTransports } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import { SOURCE_LABELS, type Dock, type Transport, type DockAssignment } from '../../types'

interface DockWithData extends Dock {
  assigned: Transport | null
  queue: (DockAssignment & { transport?: Transport })[]
}

function DockUtilBar({ occupied, total }: { occupied: number; total: number }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-page rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-txt tabular-nums">{pct}%</span>
    </div>
  )
}

export default function DockManagementPage() {
  const { activeBranch } = useBranch()
  const { permissions } = useAuth()
  const canManage = permissions.includes('manage_team')
  const [docks, setDocks] = useState<DockWithData[]>([])
  const [unassigned, setUnassigned] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showCreateDock, setShowCreateDock] = useState(false)
  const [assignModal, setAssignModal] = useState<{ dockId: string; dockName: string } | null>(null)
  const [suggestModal, setSuggestModal] = useState<{ dockId: string; dockName: string } | null>(null)

  const loadData = useCallback(async () => {
    if (!activeBranch) return
    try {
      const [docksRes, transportsRes] = await Promise.all([
        docksApi.getDocks(activeBranch.id),
        getTransports({ branchId: activeBranch.id }),
      ])

      const transports = transportsRes.data
      const transportMap = new Map(transports.map((t) => [t.id, t]))

      const assignedByDock = new Map<string, Transport>()
      for (const t of transports) {
        if (t.assigned_dock_id && t.business_status === 'ACTIVE' && t.operational_status !== 'COMPLETED') {
          assignedByDock.set(t.assigned_dock_id, t)
        }
      }

      const enriched: DockWithData[] = await Promise.all(
        docksRes.data.map(async (dock) => {
          let queue: (DockAssignment & { transport?: Transport })[] = []
          try {
            const qRes = await docksApi.getDockQueue(dock.id)
            queue = qRes.data.map((a) => ({
              ...a,
              transport: transportMap.get(a.transport_id),
            }))
          } catch { /* */ }

          const queuedEntries = queue
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

          return {
            ...dock,
            assigned: assignedByDock.get(dock.id) ?? null,
            queue: queuedEntries,
          }
        }),
      )

      const assignedIds = new Set(
        enriched
          .flatMap((d) => [d.assigned?.id, ...d.queue.map((q) => q.transport_id)])
          .filter(Boolean),
      )

      setDocks(enriched)
      setUnassigned(
        transports.filter(
          (t) =>
            t.business_status === 'ACTIVE' &&
            t.operational_status !== 'COMPLETED' &&
            !assignedIds.has(t.id),
        ),
      )
    } catch { /* */ }
  }, [activeBranch])

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleBlock = async (dock: Dock, block: boolean) => {
    if (!activeBranch) return
    await docksApi.blockDock(dock.id, block, activeBranch.id)
    await loadData()
  }

  const handlePromote = async (dockId: string) => {
    if (!activeBranch) return
    await docksApi.promoteNext(dockId, activeBranch.id)
    await loadData()
  }

  const handleReorderUp = async (dock: DockWithData, index: number) => {
    if (!activeBranch || index === 0) return
    const positions = dock.queue.map((q, i) => ({
      transportId: q.transport_id,
      position: i === index ? index - 1 : i === index - 1 ? index : i,
    }))
    await docksApi.reorderQueue(dock.id, positions, activeBranch.id)
    await loadData()
  }

  const handleReorderDown = async (dock: DockWithData, index: number) => {
    if (!activeBranch || index >= dock.queue.length - 1) return
    const positions = dock.queue.map((q, i) => ({
      transportId: q.transport_id,
      position: i === index ? index + 1 : i === index + 1 ? index : i,
    }))
    await docksApi.reorderQueue(dock.id, positions, activeBranch.id)
    await loadData()
  }

  const occupiedCount = docks.filter(d => d.status === 'OCCUPIED').length
  const availableCount = docks.filter(d => d.status === 'AVAILABLE').length
  const blockedCount = docks.filter(d => d.status === 'BLOCKED' || d.status === 'BLOCKED_PENDING').length

  if (!activeBranch) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-txt-dim text-sm">Select a branch to manage docks</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-edge p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
            <Container className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-txt">{docks.length}</p>
            <p className="text-[10px] text-txt-muted">Total Docks</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-edge p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-accent">{availableCount}</p>
            <p className="text-[10px] text-txt-muted">Available</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-edge p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
            <Gauge className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-primary">{occupiedCount}</p>
            <p className="text-[10px] text-txt-muted">Occupied</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-edge p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger-soft flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-danger">{blockedCount}</p>
            <p className="text-[10px] text-txt-muted">Blocked</p>
          </div>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="bg-card rounded-2xl border border-edge p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-txt">Dock Utilization</span>
          </div>
          <span className="text-xs text-txt-muted">{occupiedCount}/{docks.length} occupied</span>
        </div>
        <DockUtilBar occupied={occupiedCount} total={docks.length} />
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-txt-dim text-sm">
          <span className="font-medium text-txt">{docks.length}</span> docks · <span className="font-medium text-warning">{unassigned.length}</span> unassigned transports
        </p>
        <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={() => setShowCreateDock(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all">
              <Plus className="w-4 h-4" /> New Dock
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-edge rounded-xl text-sm text-txt-dim hover:text-txt hover:border-edge-strong transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCreateDock && (
        <CreateDockModal branchId={activeBranch.id} onClose={() => setShowCreateDock(false)} onCreated={() => { setShowCreateDock(false); loadData() }} />
      )}
      {assignModal && (
        <SelectTransportModal title={`Assign to ${assignModal.dockName}`} transports={unassigned}
          onSelect={async (tId) => {
            await docksApi.assignDock(assignModal.dockId, tId, activeBranch.id, true)
            setAssignModal(null)
            await loadData()
          }}
          onClose={() => setAssignModal(null)} />
      )}
      {suggestModal && (
        <SelectTransportModal title={`Suggest for ${suggestModal.dockName}`} transports={unassigned}
          onSelect={async (tId) => {
            await docksApi.suggestDock(suggestModal.dockId, tId, activeBranch.id)
            setSuggestModal(null)
            await loadData()
          }}
          onClose={() => setSuggestModal(null)} />
      )}

      {/* Dock Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {docks.map((dock, i) => (
            <div key={dock.id}
              className="bg-card border border-edge rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}>

              {/* Status top stripe */}
              <div className={`h-1 ${
                dock.status === 'AVAILABLE' ? 'bg-gradient-to-r from-accent to-accent-light' :
                dock.status === 'OCCUPIED' ? 'bg-gradient-to-r from-primary to-primary-light' :
                dock.status === 'BLOCKED' ? 'bg-gradient-to-r from-danger to-red-400' : 'bg-gradient-to-r from-warning to-amber-400'
              }`} />

              <div className="px-4 py-3.5 border-b border-edge">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${
                        dock.status === 'AVAILABLE' ? 'bg-accent' :
                        dock.status === 'OCCUPIED' ? 'bg-primary' :
                        dock.status === 'BLOCKED' ? 'bg-danger' : 'bg-warning'
                      }`} />
                      {dock.status === 'AVAILABLE' && (
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent animate-pulse-dot" />
                      )}
                    </div>
                    <span className="font-display text-sm font-semibold text-txt">{dock.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge kind="dock" status={dock.status} />
                    {(dock.status === 'BLOCKED' || dock.status === 'BLOCKED_PENDING') ? (
                      <button onClick={() => handleBlock(dock, false)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors" title="Unblock">
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => handleBlock(dock, true)} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger-soft transition-colors" title="Block">
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setAssignModal({ dockId: dock.id, dockName: dock.name })}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary/10 transition-colors">
                    <ArrowRightCircle className="w-3 h-3" /> Assign
                  </button>
                  <button onClick={() => setSuggestModal({ dockId: dock.id, dockName: dock.name })}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-accent bg-accent-soft rounded-lg hover:bg-accent/10 transition-colors">
                    <Lightbulb className="w-3 h-3" /> Suggest
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[200px]">
                {dock.assigned ? (
                  <div className="bg-gradient-to-br from-primary-soft to-accent-soft/30 border border-primary/10 rounded-xl p-3.5 animate-scale-in">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-txt block truncate">
                          {dock.assigned.external_reference || dock.assigned.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge kind="operational" status={dock.assigned.operational_status} />
                      <p className="text-[10px] text-txt-muted font-mono">
                        {SOURCE_LABELS[dock.assigned.source_system] ?? dock.assigned.source_system}
                      </p>
                    </div>
                    <p className="text-[10px] text-txt-muted mt-2">
                      Updated {new Date(dock.assigned.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-edge rounded-xl p-8 flex flex-col items-center justify-center group hover:border-accent/30 transition-colors">
                    <Container className="w-6 h-6 text-txt-placeholder mb-2 group-hover:text-accent transition-colors animate-float" />
                    <span className="text-xs text-txt-muted">No assignment</span>
                    <span className="text-[9px] text-txt-placeholder mt-0.5">Drag or assign a transport</span>
                  </div>
                )}

                {dock.queue.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-txt-dim uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-warning" />
                        Queue ({dock.queue.length})
                      </span>
                      <button onClick={() => handlePromote(dock.id)}
                        className="text-[11px] text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors">
                        <ChevronUp className="w-3 h-3" /> Promote
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {dock.queue.map((entry, qi) => (
                        <div key={entry.id}
                          className="flex items-center gap-2 px-3 py-2 bg-page rounded-lg hover:bg-primary-soft/30 transition-colors animate-slide-right"
                          style={{ animationDelay: `${qi * 60}ms` }}>
                          <span className="text-[10px] font-mono text-txt-muted w-5 h-5 rounded-md bg-edge/50 flex items-center justify-center font-bold">{qi + 1}</span>
                          <Truck className="w-3.5 h-3.5 text-txt-muted" />
                          <span className="text-xs text-txt font-medium truncate flex-1">
                            {entry.transport?.external_reference || entry.transport_id.slice(0, 8)}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button disabled={qi === 0} onClick={() => handleReorderUp(dock, qi)}
                              className="p-0.5 text-txt-muted hover:text-primary disabled:opacity-30 transition-colors">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button disabled={qi >= dock.queue.length - 1} onClick={() => handleReorderDown(dock, qi)}
                              className="p-0.5 text-txt-muted hover:text-primary disabled:opacity-30 transition-colors">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned transports */}
          {unassigned.length > 0 && (
            <div className="bg-card border border-dashed border-warning/30 rounded-2xl overflow-hidden animate-slide-up">
              <div className="px-4 py-3.5 border-b border-edge bg-warning-soft/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-display text-sm font-semibold text-txt">Unassigned</span>
                  <span className="text-[10px] bg-warning text-white px-2 py-0.5 rounded-full font-bold">{unassigned.length}</span>
                </div>
              </div>
              <div className="p-3 space-y-1.5 max-h-[500px] overflow-y-auto">
                {unassigned.map((t, i) => (
                  <div key={t.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-page rounded-lg hover:bg-primary-soft transition-colors cursor-pointer group animate-slide-right"
                    style={{ animationDelay: `${i * 40}ms` }}>
                    <Truck className="w-4 h-4 text-txt-muted group-hover:text-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-txt truncate">{t.external_reference || t.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-txt-muted font-mono">{SOURCE_LABELS[t.source_system] ?? t.source_system}</p>
                    </div>
                    <StatusBadge kind="operational" status={t.operational_status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Create Dock Modal ─── */

function CreateDockModal({ branchId, onClose, onCreated }: { branchId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await docksApi.createDock(branchId, name)
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create dock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-edge shadow-xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-txt">Create Dock</h2>
          <button onClick={onClose} className="p-1 text-txt-muted hover:text-txt"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-txt mb-1.5">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Dock A1" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-page border border-edge rounded-xl text-sm font-medium text-txt-dim hover:text-txt transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Select Transport Modal (for assign/suggest) ─── */

function SelectTransportModal({ title, transports, onSelect, onClose }: {
  title: string
  transports: Transport[]
  onSelect: (transportId: string) => Promise<void>
  onClose: () => void
}) {
  const [selected, setSelected] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!selected) return
    setError('')
    setSubmitting(true)
    try {
      await onSelect(selected)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-edge shadow-xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-txt">{title}</h2>
          <button onClick={onClose} className="p-1 text-txt-muted hover:text-txt"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2 mb-4">{error}</p>
        )}
        {transports.length === 0 ? (
          <p className="text-sm text-txt-muted text-center py-6">No unassigned transports available</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto mb-4">
            {transports.map((t) => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  selected === t.id ? 'bg-primary-soft border border-primary/20 shadow-sm' : 'bg-page hover:bg-primary-soft/50'
                }`}>
                <Truck className={`w-4 h-4 ${selected === t.id ? 'text-primary' : 'text-txt-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt truncate">{t.external_reference || t.id.slice(0, 12)}</p>
                  <p className="text-[11px] text-txt-muted font-mono">{SOURCE_LABELS[t.source_system] ?? t.source_system}</p>
                </div>
                <StatusBadge kind="operational" status={t.operational_status} />
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-page border border-edge rounded-xl text-sm font-medium text-txt-dim hover:text-txt transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={!selected || submitting}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
