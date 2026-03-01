import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { createApiClient, type ApiClient } from "../api/client";
import * as auth from "../api/auth";
import type { UserProfile } from "../types/api";

type AuthContextValue = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  isInitializing: boolean;
  logout: () => Promise<void>;
  apiClient: ApiClient;
  profile: UserProfile | null;
  permissions: string[];
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const tokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    setAccessTokenState(token);
    if (!token) {
      setProfile(null);
      setPermissions([]);
    }
  }, []);

  const apiClient = useMemo(
    () => createApiClient(() => tokenRef.current, setAccessToken),
    [setAccessToken]
  );

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setAccessToken(null);
    }
  }, [setAccessToken]);

  useEffect(() => {
    let cancelled = false;
    auth
      .refresh()
      .then((token) => {
        if (cancelled) return;
        if (token) setAccessToken(token);
        setIsInitializing(false);
      })
      .catch(() => {
        if (!cancelled) setIsInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setAccessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    auth.getMe(apiClient.get).then(({ profile: p, permissions: perms }) => {
      if (!cancelled) {
        setProfile(p);
        setPermissions(perms);
      }
    }).catch(() => {
      if (!cancelled) setProfile(null);
    });
    return () => { cancelled = true; };
  }, [accessToken, apiClient.get]);

  const value: AuthContextValue = {
    accessToken,
    setAccessToken,
    isInitializing,
    logout,
    apiClient,
    profile,
    permissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
