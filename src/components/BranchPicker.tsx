import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import * as branchesApi from "../api/branches";
import type { Branch } from "../types/api";

export default function BranchPicker() {
  const { apiClient } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    branchesApi
      .listBranches(apiClient.get)
      .then((list) => {
        if (!cancelled) {
          setBranches(list.filter((b) => b.is_active !== false));
          if (list.length > 0 && !selectedBranch) setSelectedBranch(list[0]);
        }
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient.get, selectedBranch, setSelectedBranch]);

  if (loading) {
    return <div className="h-7 w-32 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 min-w-[8rem]"
      >
        <span className="truncate">
          {selectedBranch ? `${selectedBranch.name} (${selectedBranch.code})` : "Wybierz oddział"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-52 max-h-48 overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-0.5 z-20 custom-scrollbar shadow-card">
            {branches.length === 0 ? (
              <div className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">Brak oddziałów</div>
            ) : (
              branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBranch(b);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedBranch?.id === b.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-medium" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div>{b.name}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{b.code}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
