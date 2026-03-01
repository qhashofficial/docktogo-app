import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import * as transportsApi from "../../api/transports";
import * as docksApi from "../../api/docks";
import type { TransportDetail, TransportOperationalStatus } from "../../types/api";
import { TransportOpStatusBadge, TransportBizStatusBadge } from "../../components/StatusBadge";

const ALLOWED_TRANSITIONS: Record<TransportOperationalStatus, TransportOperationalStatus[]> = {
  PLANNED: ["ARRIVING", "QUEUED"],
  ARRIVING: ["WAITING", "QUEUED"],
  QUEUED: ["ARRIVING", "PLANNED"],
  WAITING: ["IN_PROCESS", "ARRIVING"],
  IN_PROCESS: ["PAUSED", "READY"],
  PAUSED: ["IN_PROCESS"],
  READY: ["COMPLETED", "IN_PROCESS"],
  COMPLETED: [],
};

export default function TransportDetailPage() {
  const { transportId } = useParams<{ transportId: string }>();
  const { apiClient } = useAuth();
  const { selectedBranch } = useBranch();
  const [detail, setDetail] = useState<TransportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [toStatus, setToStatus] = useState<TransportOperationalStatus | "">("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [docks, setDocks] = useState<{ id: string; name: string }[]>([]);
  const [suggestedDockId, setSuggestedDockId] = useState<string | null>(null);
  const [quantityEdits, setQuantityEdits] = useState<Record<string, { declared_qty?: number | null; unloaded_qty?: number | null }>>({});

  const load = () => {
    if (!transportId || !selectedBranch) return;
    setLoading(true);
    transportsApi.getTransportDetail(apiClient.get, transportId, selectedBranch.id).then((d) => {
      setDetail(d);
      setSuggestedDockId(d.suggested_dock_id);
      setQuantityEdits(Object.fromEntries((d.items ?? []).map((it) => [it.id, { declared_qty: it.declared_qty, unloaded_qty: it.unloaded_qty }])));
    }).catch(() => setDetail(null)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [apiClient.get, transportId, selectedBranch?.id]);

  useEffect(() => {
    if (!selectedBranch) return;
    docksApi.listDocks(apiClient.get, selectedBranch.id).then((list) => setDocks(list)).catch(() => setDocks([]));
  }, [apiClient.get, selectedBranch?.id]);

  const handleStatusChange = async () => {
    if (!transportId || !selectedBranch || !toStatus) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await transportsApi.updateTransportStatus(apiClient.patch, transportId, toStatus as TransportOperationalStatus, selectedBranch.id, reason || undefined);
      setMessage({ type: "success", text: "Status zaktualizowany" });
      setStatusModal(false);
      setToStatus("");
      setReason("");
      load();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Błąd" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetSuggestedDock = async () => {
    if (!transportId || !selectedBranch) return;
    setSubmitting(true);
    try {
      await transportsApi.setSuggestedDock(apiClient.patch, transportId, suggestedDockId, selectedBranch.id);
      setMessage({ type: "success", text: "Sugerowana rampa zapisana" });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Błąd" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveQuantities = async () => {
    if (!transportId || !selectedBranch || !detail?.items?.length) return;
    const items = detail.items.map((it) => ({ itemId: it.id, ...quantityEdits[it.id] })).filter((it) => quantityEdits[it.itemId] != null);
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      await transportsApi.updateTransportQuantities(apiClient.patch, transportId, selectedBranch.id, items);
      setMessage({ type: "success", text: "Ilości zaktualizowane" });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Błąd" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedBranch) {
    return (
      <div className="p-3">
        <Link to="/transports" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">← Transporty</Link>
        <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-200">Wybierz oddział.</div>
      </div>
    );
  }

  if ((loading && !detail) || !detail) {
    return (
      <div className="p-3">
        <Link to="/transports" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">← Transporty</Link>
        <div className="mt-3 p-6 text-center text-xs text-gray-500 dark:text-gray-400">{detail ? "Ładowanie..." : "Transport nie znaleziony."}</div>
      </div>
    );
  }

  const nextStatuses = ALLOWED_TRANSITIONS[detail.operational_status] ?? [];

  return (
    <div className="p-3 space-y-3">
      <Link to="/transports" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Transporty
      </Link>

      {message && (
        <div className={`p-2 rounded-md text-xs ${message.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">{detail.external_reference}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">ID: {detail.id}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <TransportOpStatusBadge status={detail.operational_status} />
                <TransportBizStatusBadge status={detail.business_status} />
              </div>
            </div>
            {nextStatuses.length > 0 && (
              <button type="button" onClick={() => setStatusModal(true)} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600">
                Zmień status
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Czasy</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              <li>ETA planowana: {detail.eta_planned_at ? new Date(detail.eta_planned_at).toLocaleString("pl-PL") : "—"}</li>
              <li>Przyjazd: {detail.arrived_at ? new Date(detail.arrived_at).toLocaleString("pl-PL") : "—"}</li>
              <li>Oczekiwanie: {detail.waiting_at ? new Date(detail.waiting_at).toLocaleString("pl-PL") : "—"}</li>
              <li>W realizacji: {detail.in_process_at ? new Date(detail.in_process_at).toLocaleString("pl-PL") : "—"}</li>
              <li>Gotowy: {detail.ready_at ? new Date(detail.ready_at).toLocaleString("pl-PL") : "—"}</li>
              <li>Zakończony: {detail.completed_at ? new Date(detail.completed_at).toLocaleString("pl-PL") : "—"}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sugerowana rampa</h3>
            <div className="flex gap-1.5">
              <select value={suggestedDockId ?? ""} onChange={(e) => setSuggestedDockId(e.target.value || null)} className="flex-1 px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">— Brak —</option>
                {docks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button type="button" onClick={handleSetSuggestedDock} disabled={submitting} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50">Zapisz</button>
            </div>
          </div>
        </div>

        {detail.status_history?.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Historia statusu</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              {detail.status_history.map((h) => (
                <li key={h.id} className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  {h.from_status} → {h.to_status}
                  {h.reason && ` (${h.reason})`}
                  <span className="text-gray-400 dark:text-gray-500 ml-1.5">{new Date(h.created_at).toLocaleString("pl-PL")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detail.items?.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Pozycje / ilości</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-1.5 px-2 text-gray-600 dark:text-gray-400 font-medium">Typ / Ref</th>
                  <th className="py-1.5 px-2 text-gray-600 dark:text-gray-400 font-medium">Oczek.</th>
                  <th className="py-1.5 px-2 text-gray-600 dark:text-gray-400 font-medium">Zadeklarowana</th>
                  <th className="py-1.5 px-2 text-gray-600 dark:text-gray-400 font-medium">Rozładowana</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-1.5 px-2 text-gray-900 dark:text-white">{it.reference_type} / {it.reference_value}</td>
                    <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{it.expected_qty ?? "—"}</td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={quantityEdits[it.id]?.declared_qty ?? it.declared_qty ?? ""} onChange={(e) => setQuantityEdits((prev) => ({ ...prev, [it.id]: { ...prev[it.id], declared_qty: e.target.value === "" ? null : parseInt(e.target.value, 10) } }))} className="w-16 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={quantityEdits[it.id]?.unloaded_qty ?? it.unloaded_qty ?? ""} onChange={(e) => setQuantityEdits((prev) => ({ ...prev, [it.id]: { ...prev[it.id], unloaded_qty: e.target.value === "" ? null : parseInt(e.target.value, 10) } }))} className="w-16 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={handleSaveQuantities} disabled={submitting} className="mt-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 disabled:opacity-50">Zapisz ilości</button>
          </div>
        )}
      </div>

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setStatusModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-card border border-gray-200 dark:border-gray-700 max-w-sm w-full p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Zmiana statusu</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Aktualny: {detail.operational_status}. Dozwolone: {nextStatuses.join(", ")}.</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Nowy status</label>
              <select value={toStatus} onChange={(e) => setToStatus(e.target.value as TransportOperationalStatus)} className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">— Wybierz —</option>
                {nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Powód (opcjonalnie)</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="np. operacyjna zmiana" />
            </div>
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => setStatusModal(false)} className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Anuluj</button>
              <button type="button" onClick={handleStatusChange} disabled={!toStatus || submitting} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50">{submitting ? "..." : "Zapisz"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
