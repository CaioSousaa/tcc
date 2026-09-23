import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  refreshStoredTokens,
} from "./authStorage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const api = axios.create({ baseURL: API_URL });

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshingPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Sem refresh token");
  }

  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_URL}/auth/refresh`,
    { refreshToken }
  );

  refreshStoredTokens({
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  });

  return response.data.accessToken;
}

/** Runs a single refresh at a time and shares it with every pending request. */
function refreshAccessToken(): Promise<string> {
  if (!refreshingPromise) {
    refreshingPromise = requestNewAccessToken().finally(() => {
      refreshingPromise = null;
    });
  }

  return refreshingPromise;
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthRoute = config?.url?.includes("/auth/login") || config?.url?.includes("/auth/refresh");

    if (error.response?.status !== 401 || !config || config._retried || isAuthRoute) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      const accessToken = await refreshAccessToken();

      config.headers.set("Authorization", `Bearer ${accessToken}`);

      return api.request(config as AxiosRequestConfig);
    } catch {
      clearTokens();
      onSessionExpired?.();

      return Promise.reject(error);
    }
  }
);
