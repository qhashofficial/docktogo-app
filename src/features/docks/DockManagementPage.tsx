import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GripVertical,
  LayoutList,
  ArrowUp,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Plus,
  Clock,
  User,
  Pencil,
  ArrowRight,
  Warehouse,
  Package,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import * as docksApi from "../../api/docks";
import * as transportsApi from "../../api/transports";
import type { Dock, DockQueueEntry, Transport, TransportOperationalStatus } from "../../types/api";

const ASSIGNABLE_STATUSES = ["PLANNED", "ARRIVING", "QUEUED"] as const;
const DRAG_TYPE = "application/x-docktogo-transport-id";

const OP_STATUS_LABEL: Record<TransportOperationalStatus, string> = {
  PLANNED: "Planowany",
  ARRIVING: "Arriving",
  WAITING: "Waiting",
  QUEUED: "Queued",
  IN_PROCESS: "UNLOADING",
  PAUSED: "Paused",
  READY: "Ready",
  COMPLETED: "Completed",
};

function useDockManagementData(branchId: string | undefined, get: (path: string) => Promise<Response>) {
  const [docks, setDocks] = useState<Dock[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [queues, setQueues] = useState<Record<string, DockQueueEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!branchId) {
      setDocks([]);
      setTransports([]);
      setQueues({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      docksApi.listDocks(get, branchId),
      transportsApi.listTransports(get, branchId, { businessStatus: "ACTIVE" }),
    ])
      .then(([dockList, transportList]) => {
        setDocks(dockList);
        setTransports(transportList);
        return Promise.all(
          dockList.map((d) =>
            docksApi.getDockQueue(get, d.id).then((q) => ({ dockId: d.id, queue: q }))
          )
        );
      })
      .then((results) => {
        const byDock: Record<string, DockQueueEntry[]> = {};
        results.forEach(({ dockId, queue }) => {
          byDock[dockId] = queue;
        });
        setQueues(byDock);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Błąd ładowania"))
      .finally(() => setLoading(false));
  }, [branchId, get]);

  useEffect(() => {
    load();
  }, [load]);

  const transportById = transports.reduce<Record<string, Transport>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const poolTransports = transports.filter(
    (t) =>
      ASSIGNABLE_STATUSES.includes(t.operational_status as (typeof ASSIGNABLE_STATUSES)[number]) &&
      t.assigned_dock_id == null
  );

  const assignedByDockId = transports.reduce<Record<string, Transport>>((acc, t) => {
    if (t.assigned_dock_id) acc[t.assigned_dock_id] = t;
    return acc;
  }, {});

  return {
    docks,
    transportById,
    queues,
    assignedByDockId,
    poolTransports,
    loading,
    error,
    reload: load,
  };
}

function TruckCardRef({ transport }: { transport: Transport }) {
  const timeStr =
    transport.arrived_at || transport.in_process_at || transport.eta_planned_at || transport.updated_at
      ? new Date(
          transport.arrived_at || transport.in_process_at || transport.eta_planned_at || transport.updated_at
        ).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
      : "—";
  const statusLabel = OP_STATUS_LABEL[transport.operational_status] ?? transport.operational_status;
  const shortId = transport.id.slice(0, 8);

  return (
    <div
      className="flex rounded-lg overflow-hidden bg-[#2B3544] border border-[#3d4754]"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}
    >
      <div className="w-9 flex-shrink-0 flex items-center justify-center bg-[#4C84F3] py-3 overflow-hidden">
        <span
          className="text-[10px] font-semibold text-white uppercase tracking-wider whitespace-nowrap"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex-1 min-w-0 p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-white">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium">{timeStr}</span>
          </div>
          <button type="button" className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10" title="Edytuj">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-white">
            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs">—</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#4C84F3] text-white shrink-0">
            {statusLabel}
          </span>
        </div>
        <div className="text-xs font-medium text-white truncate">{transport.external_reference}</div>
        <div className="text-[11px] text-gray-400 truncate">{transport.source_system || "—"}</div>
        <div className="rounded bg-[#3F51B5] px-2 py-1.5">
          <span className="text-xs font-mono text-white">{shortId}</span>
        </div>
        <button
          type="button"
          className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs text-white border border-[#3d4754] bg-[#515B6C] hover:bg-[#5a6576]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Waiting
        </button>
      </div>
    </div>
  );
}

function TransportCardPool({ transport, showDragHandle }: { transport: Transport; showDragHandle?: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-[#2B3544] border border-[#3d4754] p-2 min-w-0 cursor-grab active:cursor-grabbing"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
      data-transport-id={transport.id}
    >
      {showDragHandle && (
        <div className="flex-shrink-0 text-gray-400 cursor-grab" aria-hidden>
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-xs truncate">{transport.external_reference}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {transport.eta_planned_at
            ? new Date(transport.eta_planned_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })
            : transport.operational_status}
        </div>
      </div>
    </div>
  );
}

export default function DockManagementPage() {
  const { apiClient } = useAuth();
  const { selectedBranch } = useBranch();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null);
  const [dragOverDockId, setDragOverDockId] = useState<string | null>(null);

  const { docks, transportById, queues, assignedByDockId, poolTransports, loading, error, reload } =
    useDockManagementData(selectedBranch?.id, apiClient.get);

  const handleAssign = useCallback(
    async (dockId: string, transportId: string, queueIfOccupied: boolean) => {
      if (!selectedBranch) return;
      setMessage(null);
      try {
        await docksApi.assignTransportToDock(apiClient.post, dockId, transportId, selectedBranch.id, queueIfOccupied);
        setMessage({ type: "success", text: "Transport przypisany do rampy" });
        reload();
      } catch (e) {
        setMessage({ type: "error", text: e instanceof Error ? e.message : "Nie udało się przypisać" });
      }
    },
    [apiClient.post, selectedBranch, reload]
  );

  const handlePromote = useCallback(
    async (dockId: string) => {
      setPromoteLoading(dockId);
      setMessage(null);
      try {
        await docksApi.promoteNextInQueue(apiClient.post, dockId);
        setMessage({ type: "success", text: "Następny w kolejce promowany na rampę" });
        reload();
      } catch (e) {
        setMessage({ type: "error", text: e instanceof Error ? e.message : "Nie udało się promować" });
      } finally {
        setPromoteLoading(null);
      }
    },
    [apiClient.post, reload]
  );

  const onDragStart = (e: React.DragEvent, transportId: string) => {
    e.dataTransfer.setData(DRAG_TYPE, transportId);
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).classList.add("opacity-50");
  };

  const onDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove("opacity-50");
    setDragOverDockId(null);
  };

  const onDragOver = (e: React.DragEvent, dockId: string) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes(DRAG_TYPE)) e.dataTransfer.dropEffect = "move";
    setDragOverDockId(dockId);
  };

  const onDrop = (e: React.DragEvent, dock: Dock) => {
    e.preventDefault();
    setDragOverDockId(null);
    const transportId = e.dataTransfer.getData(DRAG_TYPE);
    if (!transportId || !selectedBranch) return;
    if (dock.status === "BLOCKED" || dock.status === "BLOCKED_PENDING") {
      setMessage({ type: "error", text: "Nie można przypisać do zablokowanej rampy" });
      return;
    }
    handleAssign(dock.id, transportId, dock.status === "OCCUPIED");
  };

  if (!selectedBranch) {
    return (
      <div className="p-3 space-y-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Zarządzanie rampami</h1>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-200">
          Wybierz oddział w nagłówku.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#212936] min-h-0">
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-[#2B3544]">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-white">Zarządzanie rampami</h1>
          <span className="text-xs text-gray-400">Oddział: {selectedBranch.name}</span>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
            title="Odśwież"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <Link
          to="/docks"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#4C84F3] hover:text-[#6b9cff]"
        >
          Lista ramp <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {message && (
        <div
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 mx-3 mt-2 rounded-lg text-xs ${
            message.type === "success"
              ? "bg-green-900/40 text-green-200 border border-green-700/50"
              : "bg-red-900/40 text-red-200 border border-red-700/50"
          }`}
        >
          {message.type === "error" && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {error && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 mx-3 mt-2 rounded-lg text-xs bg-red-900/40 text-red-200 border border-red-700/50">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Ładowanie…</div>
      ) : (
        <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-x-auto overflow-y-hidden">
          <div
            className="flex-shrink-0 w-56 flex flex-col rounded-xl overflow-hidden border border-[#3d4754] bg-[#2B3544]"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 bg-[#515B6C] border-b border-[#3d4754] rounded-t-xl"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
            >
              <LayoutList className="w-4 h-4 text-white flex-shrink-0" />
              <span className="text-xs font-semibold text-white">Do przypisania {poolTransports.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[140px]">
              {poolTransports.map((t) => (
                <div key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)} onDragEnd={onDragEnd}>
                  <TransportCardPool transport={t} showDragHandle />
                </div>
              ))}
              {poolTransports.length === 0 && (
                <div className="text-[11px] text-gray-400 py-6 text-center">Brak transportów do przypisania</div>
              )}
            </div>
          </div>

          {docks.map((dock) => {
            const queue = queues[dock.id] ?? [];
            const queued = [...queue].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            const assignedTransport = assignedByDockId[dock.id];
            const truckCount = assignedTransport ? 1 : 0;
            const isDropTarget = dragOverDockId === dock.id;
            const canDrop = dock.status !== "BLOCKED" && dock.status !== "BLOCKED_PENDING";
            const headerBg = assignedTransport ? "bg-[#2979FF]" : "bg-[#515B6C]";

            return (
              <div
                key={dock.id}
                className={`flex-shrink-0 w-56 flex flex-col rounded-xl overflow-hidden border transition-colors ${
                  canDrop && isDropTarget
                    ? "border-[#4C84F3] ring-2 ring-[#4C84F3]/50"
                    : "border-[#3d4754]"
                }`}
                style={{
                  backgroundColor: "#2B3544",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                }}
                onDragOver={(e) => onDragOver(e, dock.id)}
                onDragLeave={() => setDragOverDockId(null)}
                onDrop={(e) => onDrop(e, dock)}
              >
                <div
                  className={`${headerBg} flex items-center justify-between gap-2 px-3 py-2.5 rounded-t-xl border-b border-black/10`}
                  style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="text-xs font-semibold text-white truncate uppercase">{dock.name}</span>
                    </div>
                    <span className="text-[10px] text-white/90 mt-0.5">
                      {truckCount} truck{truckCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {assignedTransport && (
                      <span className="text-[10px] text-[#90CAF9] hidden sm:inline">
                        Status {OP_STATUS_LABEL[assignedTransport.operational_status]}
                      </span>
                    )}
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white border border-white/30 flex-shrink-0"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                      title="Dodaj transport"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-2 py-2 flex flex-col gap-2 min-h-[140px]">
                  {assignedTransport && (
                    <TruckCardRef transport={assignedTransport} />
                  )}
                  {queued.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-medium">Kolejka ({queued.length})</span>
                        {(dock.status === "AVAILABLE" || dock.status === "OCCUPIED") && (
                          <button
                            type="button"
                            onClick={() => handlePromote(dock.id)}
                            disabled={promoteLoading === dock.id}
                            className="flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium bg-[#2979FF] text-white hover:bg-[#1a6ae6] disabled:opacity-50"
                            title="Promuj następny w kolejce"
                          >
                            <ArrowUp className="w-3 h-3" /> Promuj
                          </button>
                        )}
                      </div>
                      {queued.map((entry) => {
                        const t = transportById[entry.transport_id];
                        if (!t) return null;
                        return (
                          <div key={entry.id} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-5 flex-shrink-0">{entry.position ?? "—"}</span>
                            <div className="flex-1 min-w-0">
                              <TransportCardPool transport={t} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!assignedTransport && queued.length === 0 && (
                    <div
                      className={`flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center min-h-[140px] px-3 py-4 ${
                        canDrop && isDropTarget
                          ? "border-[#4C84F3] text-[#4C84F3] bg-[#4C84F3]/10"
                          : "border-[#3d4754] text-gray-400 bg-[#252d38]"
                      }`}
                    >
                      <Package className={`w-10 h-10 mb-3 flex-shrink-0 ${canDrop && isDropTarget ? "text-[#4C84F3]" : "text-gray-500"}`} />
                      <span className="text-[11px] leading-tight block">
                        Drop truck blocks here to assign to {dock.name}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Or use the + button to add a quick entry
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
