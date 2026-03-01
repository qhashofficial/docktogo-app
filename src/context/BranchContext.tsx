import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { Branch } from '../types'
import { getBranches } from '../api/branches'
import { useAuth } from './AuthContext'

interface BranchState {
  branches: Branch[]
  activeBranch: Branch | null
  setBranch: (branch: Branch) => void
  loading: boolean
  refresh: () => void
}

const BranchContext = createContext<BranchState | null>(null)

const STORAGE_KEY = 'docktogo-branch-id'

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    getBranches()
      .then((res) => {
        const list = res.data
        setBranches(list)
        const savedId = localStorage.getItem(STORAGE_KEY)
        const saved = list.find((b) => b.id === savedId)
        setActiveBranch(saved || list[0] || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(load, [load])

  const setBranch = useCallback((b: Branch) => {
    setActiveBranch(b)
    localStorage.setItem(STORAGE_KEY, b.id)
  }, [])

  return (
    <BranchContext.Provider
      value={{ branches, activeBranch, setBranch, loading, refresh: load }}
    >
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const ctx = useContext(BranchContext)
  if (!ctx) throw new Error('useBranch must be used within BranchProvider')
  return ctx
}
