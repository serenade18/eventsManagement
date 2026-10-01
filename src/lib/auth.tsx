import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { hasSession, setAuthFailureHandler, setTokens } from "./api/client";
import * as api from "./api/endpoints";
import type { User, UserType } from "./api/types";

type Status = "loading" | "anon" | "authed";

interface AuthValue {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Where a role lands after login. Sponsors have no dashboard data yet (spec §6). */
export function homeFor(user: Pick<User, "user_type"> | null) {
  return user?.user_type === "sponsor" ? "/console/profile" : "/console";
}

export function canManageEvents(t: UserType | undefined) {
  return t === "organizer" || t === "admin";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(() => (hasSession() ? "loading" : "anon"));
  const [user, setUserState] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  useEffect(() => {
    if (status !== "loading") return;
    api
      .getMe()
      .then((u) => {
        setUserState(u);
        setStatus("authed");
      })
      .catch(() => {
        setTokens(null);
        setStatus("anon");
      });
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = useCallback(() => {
    setTokens(null);
    setUserState(null);
    setStatus("anon");
    qc.removeQueries({ predicate: (q) => !["public-events", "order", "ticket"].includes(String(q.queryKey[0])) });
  }, [qc]);

  // A refresh that fails mid-session sends the user back to login.
  useEffect(() => {
    setAuthFailureHandler(() => {
      clear();
      const next = location.pathname + location.search;
      if (next.startsWith("/console")) navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
    });
    return () => setAuthFailureHandler(null);
  }, [clear, location.pathname, location.search, navigate]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      login: async (email, password) => {
        await api.login(email, password);
        const u = await api.getMe();
        setUserState(u);
        setStatus("authed");
        return u;
      },
      logout: () => {
        clear();
        navigate("/login", { replace: true });
      },
      setUser: (u) => setUserState(u),
    }),
    [status, user, clear, navigate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
