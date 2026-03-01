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
        enriched.flatMap((d) => [
          d.assigned?.id,
          ...d.queue.map((q) => q.transportId),
        ]).filter(Boolean),
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center animate-fade-in">
          <AlertTriangle className="w-8 h-8 text-brand mx-auto mb-3" />
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
          <h1 className="font-display text-3xl font-bold tracking-tight text-txt uppercase">
            Dock Management
          </h1>
          <p className="text-txt-dim text-sm mt-1">
            {docks.length} docks · {unassigned.length} unassigned transports
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-raised border border-edge rounded-xl text-sm text-txt-dim hover:text-txt hover:border-edge-bright transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {/* Dock columns */}
          {docks.map((dock, i) => (
            <div
              key={dock.id}
              className="flex-shrink-0 w-72 bg-panel border border-edge rounded-xl overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Dock header */}
              <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      dock.status === 'AVAILABLE'
                        ? 'bg-dock-available animate-pulse'
                        : dock.status === 'OCCUPIED'
                          ? 'bg-dock-occupied'
                          : dock.status === 'BLOCKED'
                            ? 'bg-dock-blocked'
                            : 'bg-dock-pending'
                    }`}
                  />
                  <span className="font-display text-base font-bold text-txt uppercase tracking-wide">
                    {dock.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {dock.status === 'BLOCKED' || dock.status === 'BLOCKED_PENDING' ? (
                    <button
                      onClick={() => handleBlock(dock, false)}
                      className="p-1.5 rounded-lg text-dock-blocked hover:bg-dock-blocked/10 transition-colors"
                      title="Unblock dock"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(dock, true)}
                      className="p-1.5 rounded-lg text-txt-muted hover:text-dock-blocked hover:bg-dock-blocked/10 transition-colors"
                      title="Block dock"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[200px]">
                {/* Assigned transport */}
                {dock.assigned ? (
                  <div className="bg-raised border border-brand/20 rounded-lg p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand/60 via-brand to-brand/60" />
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand" />
                        <span className="text-sm font-semibold text-txt">
                          {dock.assigned.externalReference || dock.assigned.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge kind="operational" status={dock.assigned.operationalStatus} />
                    <div className="mt-2 text-[11px] text-txt-muted font-mono">
                      {dock.assigned.sourceSystem} · {new Date(dock.assigned.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-edge rounded-lg p-6 flex flex-col items-center justify-center text-txt-muted">
                    <Container className="w-6 h-6 mb-2 opacity-30" />
                    <span className="text-xs">No assignment</span>
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
                        className="text-[11px] text-brand hover:text-brand-light flex items-center gap-1 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Promote
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {dock.queue.map((entry, qi) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2.5 px-3 py-2 bg-raised rounded-lg border border-transparent hover:border-edge transition-colors"
                        >
                          <span className="text-[11px] font-mono text-txt-muted w-4 text-center">
                            {qi + 1}
                          </span>
                          <Truck className="w-3.5 h-3.5 text-txt-muted" />
                          <span className="text-xs text-txt font-medium truncate flex-1">
                            {entry.transport?.externalReference || entry.transportId.slice(0, 8)}
                          </span>
                          {entry.transport && (
                            <StatusBadge kind="operational" status={entry.transport.operationalStatus} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned transports column */}
          {unassigned.length > 0 && (
            <div className="flex-shrink-0 w-72 bg-panel border border-edge border-dashed rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-edge">
                <span className="font-display text-base font-bold text-txt-dim uppercase tracking-wide">
                  Unassigned ({unassigned.length})
                </span>
              </div>
              <div className="p-3 space-y-1.5 max-h-[500px] overflow-y-auto">
                {unassigned.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-raised rounded-lg border border-transparent hover:border-brand/30 transition-colors cursor-pointer group"
                  >
                    <Truck className="w-4 h-4 text-txt-muted group-hover:text-brand transition-colors" />
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
