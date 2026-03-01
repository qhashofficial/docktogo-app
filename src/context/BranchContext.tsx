import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import type { Branch } from "../types/api";

type BranchContextValue = {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const value = useMemo(
    () => ({ selectedBranch, setSelectedBranch }),
    [selectedBranch]
  );
  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
