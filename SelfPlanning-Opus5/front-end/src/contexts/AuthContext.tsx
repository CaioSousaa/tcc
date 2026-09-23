"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { setSessionExpiredHandler } from "@/lib/api";
import {
  AuthenticatedUser,
  LoginPayload,
  RegisterPayload,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
} from "@/lib/authApi";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/authStorage";

interface SignInOptions extends LoginPayload {
  keepConnected: boolean;
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoadingSession: boolean;
  isAuthenticated: boolean;
  signIn: (options: SignInOptions) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const endSession = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      router.replace("/login");
    });

    return () => setSessionExpiredHandler(null);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function restoreSession(): Promise<void> {
      if (!getAccessToken() && !getRefreshToken()) {
        if (active) {
          setIsLoadingSession(false);
        }

        return;
      }

      try {
        const restored = await meRequest();

        if (active) {
          setUser(restored);
        }
      } catch {
        if (active) {
          endSession();
        }
      } finally {
        if (active) {
          setIsLoadingSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [endSession]);

  const signIn = useCallback(async ({ email, password, keepConnected }: SignInOptions) => {
    const session = await loginRequest({ email, password });

    saveTokens(
      { accessToken: session.accessToken, refreshToken: session.refreshToken },
      keepConnected
    );

    setUser(session.user);
  }, []);

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload);

      await signIn({ email: payload.email, password: payload.password, keepConnected: true });
    },
    [signIn]
  );

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // A revogação no servidor pode falhar, mas a sessão local sempre encerra.
      }
    }

    endSession();
    router.replace("/login");
  }, [endSession, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoadingSession,
      isAuthenticated: user !== null,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoadingSession, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
