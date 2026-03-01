import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBranch } from "../../context/BranchContext";
import { useAuth } from "../../context/AuthContext";
import * as transportsApi from "../../api/transports";
import type { Transport, TransportOperationalStatus, TransportBusinessStatus } from "../../types/api";
import { TransportOpStatusBadge, TransportBizStatusBadge } from "../../components/StatusBadge";

const OP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Wszystkie (op.)" },
  { value: "PLANNED", label: "PLANNED" },
  { value: "ARRIVING", label: "ARRIVING" },
  { value: "WAITING", label: "WAITING" },
  { value: "QUEUED", label: "QUEUED" },
  { value: "IN_PROCESS", label: "IN_PROCESS" },
  { value: "PAUSED", label: "PAUSED" },
  { value: "READY", label: "READY" },
  { value: "COMPLETED", label: "COMPLETED" },
];

const BIZ_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Wszystkie (biz.)" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "CANCELED", label: "CANCELED" },
];

export default function TransportsPage() {
  const { selectedBranch } = useBranch();
  const { apiClient } = useAuth();
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [opFilter, setOpFilter] = useState<string>("");
  const [bizFilter, setBizFilter] = useState<string>("");

  useEffect(() => {
    if (!selectedBranch) {
      setTransports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const filters: { operationalStatus?: string; businessStatus?: string } = {};
    if (opFilter) filters.operationalStatus = opFilter;
    if (bizFilter) filters.businessStatus = bizFilter;
    transportsApi
      .listTransports(apiClient.get, selectedBranch.id, Object.keys(filters).length ? filters : undefined)
      .then(setTransports)
      .catch(() => setTransports([]))
      .finally(() => setLoading(false));
  }, [selectedBranch?.id, apiClient.get, opFilter, bizFilter]);

  if (!selectedBranch) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transporty</h1>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card p-4 text-xs text-gray-500 dark:text-gray-400">
          Wybierz oddział.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transporty</h1>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select
          value={opFilter}
          onChange={(e) => setOpFilter(e.target.value)}
          className="py-2 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {OP_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={bizFilter}
          onChange={(e) => setBizFilter(e.target.value)}
          className="py-2 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {BIZ_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">Ładowanie…</div>
        ) : transports.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">Brak transportów</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Ref. zewn.</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Źródło</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Status op.</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Status biz.</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Rampa</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transports.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-2 px-3 text-xs font-medium text-gray-900 dark:text-white">{t.external_reference}</td>
                  <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">{t.source_system}</td>
                  <td className="py-2 px-3">
                    <TransportOpStatusBadge status={t.operational_status as TransportOperationalStatus} />
                  </td>
                  <td className="py-2 px-3">
                    <TransportBizStatusBadge status={t.business_status as TransportBusinessStatus} />
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
                    {t.assigned_dock_id ? "Przypisana" : "—"}
                  </td>
                  <td className="py-2 px-3">
                    <Link
                      to={`/transports/${t.id}`}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
