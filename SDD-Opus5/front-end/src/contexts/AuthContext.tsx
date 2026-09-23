"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setSessionHandler, toApiError, type ApiError } from "@/lib/api";
import { loginUrl } from "@/lib/redirect";
import { authService, type User } from "@/services/authService";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  logout: () => Promise<void>;
  retry: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Confirms the session once per load of the authenticated area (N4). The user
 * lives only in memory; nothing is written to web storage (F6, N7).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [attempt, setAttempt] = useState(0);
  const pathnameRef = useRef(pathname);
  const endingRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const endSession = useCallback(
    async (reason: "logout" | "expired" | "invalid") => {
      if (endingRef.current) return;
      endingRef.current = true;
      setUser(null);
      setStatus("unauthenticated");

      // Always clears the cookie, so a stale one cannot bounce the proxy back (CB12, CB13).
      await authService.logout().catch(() => undefined);

      const target =
        reason === "logout"
          ? loginUrl()
          : loginUrl({ redirect: pathnameRef.current, expired: reason === "expired" });
      router.replace(target);
    },
    [router],
  );

  const handleSessionError = useCallback(
    (error: ApiError) => {
      void endSession(error.code === "SESSION_EXPIRED" ? "expired" : "invalid");
    },
    [endSession],
  );

  useEffect(() => {
    let cancelled = false;

    authService
      .me()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const apiError = toApiError(error);
        if (apiError.code === "SESSION_EXPIRED" || apiError.code === "UNAUTHENTICATED") {
          handleSessionError(apiError);
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, handleSessionError]);

  useEffect(() => {
    setSessionHandler(handleSessionError);
    return () => setSessionHandler(undefined);
  }, [handleSessionError]);

  const logout = useCallback(() => endSession("logout"), [endSession]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo(() => ({ status, user, logout, retry }), [status, user, logout, retry]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
