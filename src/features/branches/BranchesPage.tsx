import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as branchesApi from "../../api/branches";
import type { Branch } from "../../types/api";

export default function BranchesPage() {
  const { apiClient, permissions } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canCreate = permissions.includes("manage_all") || permissions.includes("manage_team");

  const load = () => {
    setLoading(true);
    branchesApi.listBranches(apiClient.get).then(setBranches).catch(() => setBranches([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [apiClient.get]);

  const handleCreate = async () => {
    const name = createName.trim();
    const code = createCode.trim();
    if (!name || !code) {
      setMessage({ type: "error", text: "Nazwa i kod są wymagane" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await branchesApi.createBranch(apiClient.post, { name, code });
      setMessage({ type: "success", text: "Oddział utworzony" });
      setCreateOpen(false);
      setCreateName("");
      setCreateCode("");
      load();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Błąd tworzenia" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Oddziały</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Lista oddziałów</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nowy oddział
          </button>
        )}
      </div>

      {message && (
        <div className={`p-2 rounded-md text-xs ${message.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-card">
        {loading ? (
          <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">Ładowanie...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Nazwa</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Kod</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Utworzono</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">Brak oddziałów</td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white text-xs">{b.name}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">{b.code}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${b.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                        {b.is_active ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString("pl-PL") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-card border border-gray-200 dark:border-gray-700 max-w-sm w-full p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Nowy oddział</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="np. Magazyn Centralny" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kod</label>
                <input type="text" value={createCode} onChange={(e) => setCreateCode(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="np. MC-01" />
              </div>
            </div>
            <div className="flex justify-end gap-1.5 mt-3">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Anuluj</button>
              <button type="button" onClick={handleCreate} disabled={submitting} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50">{submitting ? "..." : "Utwórz"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
