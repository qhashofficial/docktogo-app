import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Truck, Package, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import * as branchesApi from "../../api/branches";
import * as docksApi from "../../api/docks";
import * as transportsApi from "../../api/transports";

export default function Dashboard() {
  const { apiClient } = useAuth();
  const { selectedBranch } = useBranch();
  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [dockCount, setDockCount] = useState<number | null>(null);
  const [transportCount, setTransportCount] = useState<number | null>(null);

  useEffect(() => {
    branchesApi.listBranches(apiClient.get).then((list) => setBranchCount(list.length)).catch(() => setBranchCount(0));
  }, [apiClient.get]);

  useEffect(() => {
    if (!selectedBranch) {
      setDockCount(null);
      setTransportCount(null);
      return;
    }
    docksApi.listDocks(apiClient.get, selectedBranch.id).then((list) => setDockCount(list.length)).catch(() => setDockCount(0));
    transportsApi.listTransports(apiClient.get, selectedBranch.id).then((list) => setTransportCount(list.length)).catch(() => setTransportCount(0));
  }, [apiClient.get, selectedBranch]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {selectedBranch?.name ?? "Wybierz oddział"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/branches"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Oddziały</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">{branchCount ?? "—"}</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20">
              <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
            Zarządzaj <ArrowRight className="w-3 h-3 ml-0.5" />
          </div>
        </Link>

        <Link
          to="/docks"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Rampy</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                {selectedBranch ? (dockCount ?? "—") : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20">
              <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
            Rampy <ArrowRight className="w-3 h-3 ml-0.5" />
          </div>
        </Link>

        <Link
          to="/transports"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Transporty</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                {selectedBranch ? (transportCount ?? "—") : "—"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20">
              <Package className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
            Transporty <ArrowRight className="w-3 h-3 ml-0.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
