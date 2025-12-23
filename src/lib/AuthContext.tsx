// src/lib/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getToken } from "./api";
import { getCachedUser, login as doLogin, logout as doLogout, me } from "./auth";
import type { User } from "./auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      // valida token consultando backend
      const u = await me();
      setUser(u);
    } catch {
      // token inválido/expirado
      doLogout();
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refresh();
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!getToken(),
      login: async (email: string, password: string) => {
        const u = await doLogin(email, password);
        setUser(u);
      },
      logout: () => {
        doLogout();
        setUser(null);
      },
      refresh,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
