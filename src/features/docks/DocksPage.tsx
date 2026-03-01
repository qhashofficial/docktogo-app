import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Plus, Ban, Truck, ArrowUp } from "lucide-react";
import { useBranch } from "../../context/BranchContext";
import { useAuth } from "../../context/AuthContext";
import * as docksApi from "../../api/docks";
import type { Dock, DockQueueEntry } from "../../types/api";
import { DockStatusBadge } from "../../components/StatusBadge";

export default function DocksPage() {
  const { selectedBranch } = useBranch();
  const { apiClient } = useAuth();
  const [docks, setDocks] = useState<Dock[]>([]);
  const [queues, setQueues] = useState<Record<string, DockQueueEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState<Dock | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState<Dock | null>(null);
  const [newDockName, setNewDockName] = useState("");
  const [assignTransportId, setAssignTransportId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!selectedBranch) {
      setDocks([]);
      setQueues({});
      setLoading(false);
      return;
    }
    setLoading(true);
    docksApi
      .listDocks(apiClient.get, selectedBranch.id)
      .then((list) => {
        setDocks(list);
        return Promise.all(
          list.map((d) =>
            docksApi.getDockQueue(apiClient.get, d.id).then((q) => ({ dockId: d.id, queue: q }))
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
      .catch(() => setDocks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [selectedBranch?.id, apiClient.get]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !newDockName.trim()) return;
    setError(null);
    setSubmitting(true);
    docksApi
      .createDock(apiClient.post, selectedBranch.id, newDockName.trim())
      .then(() => {
        setCreateModalOpen(false);
        setNewDockName("");
        load();
      })
      .catch((err) => setError(err?.message ?? "Błąd tworzenia rampy."))
      .finally(() => setSubmitting(false));
  };

  const handleBlock = (dock: Dock, block: boolean) => {
    if (!selectedBranch) return;
    setSubmitting(true);
    docksApi
      .setDockBlock(apiClient.patch, dock.id, block, selectedBranch.id)
      .then(() => {
        setBlockModalOpen(null);
        load();
      })
      .catch((err) => setError(err?.message ?? "Błąd aktualizacji rampy."))
      .finally(() => setSubmitting(false));
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const dock = assignModalOpen;
    if (!selectedBranch || !dock || !assignTransportId.trim()) return;
    setError(null);
    setSubmitting(true);
    docksApi
      .assignTransportToDock(apiClient.post, dock.id, assignTransportId.trim(), selectedBranch.id, true)
      .then(() => {
        setAssignModalOpen(null);
        setAssignTransportId("");
        load();
      })
      .catch((err) => setError(err?.message ?? "Błąd przypisania transportu."))
      .finally(() => setSubmitting(false));
  };

  const handlePromote = (dockId: string) => {
    setSubmitting(true);
    docksApi
      .promoteNextInQueue(apiClient.post, dockId)
      .then(() => load())
      .finally(() => setSubmitting(false));
  };

  if (!selectedBranch) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rampy</h1>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card p-4 text-xs text-gray-500 dark:text-gray-400">
          Wybierz oddział w górnym pasku.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Rampy</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/docks/management"
            className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-card"
          >
            <LayoutGrid className="w-4 h-4" />
            Zarządzanie rampami
          </Link>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-card"
          >
            <Plus className="w-4 h-4" />
            Dodaj rampę
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">Ładowanie…</div>
        ) : docks.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">Brak ramp</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Nazwa</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Kolejka</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {docks.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-2 px-3 text-xs font-medium text-gray-900 dark:text-white">{d.name}</td>
                  <td className="py-2 px-3">
                    <DockStatusBadge status={d.status} />
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
                    {(queues[d.id]?.length ?? 0)} w kolejce
                  </td>
                  <td className="py-2 px-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBlockModalOpen(d)}
                      className="py-1.5 px-2 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Zablokuj / Odblokuj"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(d)}
                      className="py-1.5 px-2 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Przypisz transport"
                    >
                      <Truck className="w-3.5 h-3.5" />
                    </button>
                    {(queues[d.id]?.length ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handlePromote(d.id)}
                        disabled={submitting}
                        className="py-1.5 px-2 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        title="Promuj następny w kolejce"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" aria-hidden onClick={() => setCreateModalOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card border border-gray-200 dark:border-gray-700 w-full max-w-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Nowa rampa</h2>
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nazwa</label>
                  <input
                    type="text"
                    value={newDockName}
                    onChange={(e) => setNewDockName(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="np. Rampa 1"
                  />
                </div>
                {error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600">
                    Anuluj
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 text-white disabled:opacity-50">
                    {submitting ? "Zapisywanie…" : "Utwórz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Block modal */}
      {blockModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" aria-hidden onClick={() => setBlockModalOpen(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card border border-gray-200 dark:border-gray-700 w-full max-w-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{blockModalOpen.name}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {blockModalOpen.status === "BLOCKED" || blockModalOpen.status === "BLOCKED_PENDING"
                  ? "Odblokować rampę?"
                  : "Zablokować rampę?"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(null)}
                  className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleBlock(
                      blockModalOpen,
                      blockModalOpen.status !== "BLOCKED" && blockModalOpen.status !== "BLOCKED_PENDING"
                    )
                  }
                  disabled={submitting}
                  className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {submitting ? "…" : blockModalOpen.status === "BLOCKED" || blockModalOpen.status === "BLOCKED_PENDING" ? "Odblokuj" : "Zablokuj"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign modal */}
      {assignModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" aria-hidden onClick={() => setAssignModalOpen(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card border border-gray-200 dark:border-gray-700 w-full max-w-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Przypisz transport do {assignModalOpen.name}</h2>
              <form onSubmit={handleAssign}>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ID transportu</label>
                  <input
                    type="text"
                    value={assignTransportId}
                    onChange={(e) => setAssignTransportId(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="uuid transportu"
                  />
                </div>
                {error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAssignModalOpen(null)} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600">
                    Anuluj
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 text-white disabled:opacity-50">
                    {submitting ? "…" : "Przypisz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
