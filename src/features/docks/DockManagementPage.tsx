import { useEffect, useState, useCallback } from 'react'
import {
  Container,
  Lock,
  Unlock,
  ChevronUp,
  Truck,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import * as docksApi from '../../api/docks'
import { getTransports } from '../../api/transports'
import StatusBadge from '../../components/StatusBadge'
import type { Dock, Transport, DockAssignment } from '../../types'

interface DockWithData extends Dock {
  assigned: Transport | null
  queue: (DockAssignment & { transport?: Transport })[]
}

export default function DockManagementPage() {
  const { activeBranch } = useBranch()
  const [docks, setDocks] = useState<DockWithData[]>([])
  const [unassigned, setUnassigned] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!activeBranch) return
    try {
      const [docksRes, transportsRes] = await Promise.all([
        docksApi.getDocks(activeBranch.id),
        getTransports({ branchId: activeBranch.id }),
      ])

      const allTransports = transportsRes.data
      const transportMap = new Map(allTransports.map((t) => [t.id, t]))

      const enriched: DockWithData[] = await Promise.all(
        docksRes.data.map(async (dock) => {
          let queue: (DockAssignment & { transport?: Transport })[] = []
          try {
            const qRes = await docksApi.getDockQueue(dock.id)
            queue = qRes.data.map((a) => ({ ...a, transport: transportMap.get(a.transportId) }))
          } catch {
            /* no queue data */
          }

          const assignedEntry = queue.find((q) => q.mode === 'ASSIGNED')
          const queuedEntries = queue
            .filter((q) => q.mode === 'QUEUED')
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

          return {
            ...dock,
            assigned: assignedEntry ? transportMap.get(assignedEntry.transportId) ?? null : null,
            queue: queuedEntries,
          }
        }),
      )

      const assignedIds = new Set(
        enriched
          .flatMap((d) => [d.assigned?.id, ...d.queue.map((q) => q.transportId)])
          .filter(Boolean),
      )

      setDocks(enriched)
      setUnassigned(
        allTransports.filter(
          (t) =>
            t.businessStatus === 'ACTIVE' &&
            t.operationalStatus !== 'COMPLETED' &&
            !assignedIds.has(t.id),
        ),
      )
    } catch {
      /* handle error */
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-txt-dim text-sm">
            {docks.length} docks · {unassigned.length} unassigned transports
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-edge rounded-xl text-sm text-txt-dim hover:text-txt hover:border-edge-strong transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-8 px-8">
          {/* Dock columns */}
          {docks.map((dock, i) => (
            <div
              key={dock.id}
              className="flex-shrink-0 w-72 bg-card border border-edge rounded-2xl overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-edge flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      dock.status === 'AVAILABLE'
                        ? 'bg-dock-available'
                        : dock.status === 'OCCUPIED'
                          ? 'bg-dock-occupied'
                          : dock.status === 'BLOCKED'
                            ? 'bg-dock-blocked'
                            : 'bg-dock-pending'
                    }`}
                  />
                  <span className="font-display text-sm font-semibold text-txt">
                    {dock.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {dock.status === 'BLOCKED' || dock.status === 'BLOCKED_PENDING' ? (
                    <button
                      onClick={() => handleBlock(dock, false)}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors"
                      title="Unblock"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(dock, true)}
                      className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger-soft transition-colors"
                      title="Block"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[200px]">
                {/* Assigned transport */}
                {dock.assigned ? (
                  <div className="bg-primary-soft border border-primary/15 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-txt">
                        {dock.assigned.externalReference || dock.assigned.id.slice(0, 8)}
                      </span>
                    </div>
                    <StatusBadge kind="operational" status={dock.assigned.operationalStatus} />
                    <p className="mt-2 text-[11px] text-txt-muted font-mono">
                      {dock.assigned.sourceSystem} · {new Date(dock.assigned.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-edge rounded-xl p-8 flex flex-col items-center justify-center">
                    <Container className="w-6 h-6 text-txt-placeholder mb-2" />
                    <span className="text-xs text-txt-muted">No assignment</span>
                  </div>
                )}

                {/* Queue */}
                {dock.queue.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-txt-dim uppercase tracking-wider">
                        Queue ({dock.queue.length})
                      </span>
                      <button
                        onClick={() => handlePromote(dock.id)}
                        className="text-[11px] text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Promote
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {dock.queue.map((entry, qi) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2.5 px-3 py-2 bg-page rounded-lg"
                        >
                          <span className="text-[11px] font-mono text-txt-muted w-4 text-center">
                            {qi + 1}
                          </span>
                          <Truck className="w-3.5 h-3.5 text-txt-muted" />
                          <span className="text-xs text-txt font-medium truncate flex-1">
                            {entry.transport?.externalReference || entry.transportId.slice(0, 8)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div className="flex-shrink-0 w-72 bg-card border border-dashed border-edge-strong rounded-2xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-edge">
                <span className="font-display text-sm font-semibold text-txt-dim">
                  Unassigned ({unassigned.length})
                </span>
              </div>
              <div className="p-3 space-y-1.5 max-h-[500px] overflow-y-auto">
                {unassigned.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-page rounded-lg hover:bg-primary-soft transition-colors cursor-pointer group"
                  >
                    <Truck className="w-4 h-4 text-txt-muted group-hover:text-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-txt truncate">
                        {t.externalReference || t.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-txt-muted font-mono">{t.sourceSystem}</p>
                    </div>
                    <StatusBadge kind="operational" status={t.operationalStatus} />
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
