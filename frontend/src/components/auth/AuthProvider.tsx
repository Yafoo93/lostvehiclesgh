"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearTokens, fetchCurrentUser, logoutUser } from "@/lib/auth";
import type { AuthUser } from "@/types/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      clearTokens();
      setUser(null);
      setError(err instanceof Error ? err.message : "Failed to load session.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      logout,
    }),
    [error, loading, logout, refreshUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
