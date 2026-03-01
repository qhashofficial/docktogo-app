import type { DockStatus, TransportOperationalStatus, TransportBusinessStatus } from "../types/api";

const dockClass: Record<DockStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  OCCUPIED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  BLOCKED_PENDING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

const opClass: Record<TransportOperationalStatus, string> = {
  PLANNED: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
  ARRIVING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  WAITING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  QUEUED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  IN_PROCESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  PAUSED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  READY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  COMPLETED: "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-500",
};

const bizClass: Record<TransportBusinessStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
};

export function DockStatusBadge({ status }: { status: DockStatus }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${dockClass[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function TransportOpStatusBadge({ status }: { status: TransportOperationalStatus }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${opClass[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function TransportBizStatusBadge({ status }: { status: TransportBusinessStatus }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${bizClass[status] ?? ""}`}>
      {status}
    </span>
  );
}
