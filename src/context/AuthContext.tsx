import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '../types'
import * as authApi from '../api/auth'
import { setAccessToken } from '../api/client'

interface AuthState {
  user: User | null
  permissions: string[]
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .refreshSession()
      .then((res) => {
        setAccessToken(res.data.access_token)
        setUser(res.data.profile)
        setPermissions(res.data.permissions)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setAccessToken(res.data.access_token)
    setUser(res.data.profile)
    setPermissions(res.data.permissions)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* swallow */
    }
    setAccessToken(null)
    setUser(null)
    setPermissions([])
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.refreshSession()
      setAccessToken(res.data.access_token)
      setUser(res.data.profile)
      setPermissions(res.data.permissions)
    } catch { /* swallow */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
