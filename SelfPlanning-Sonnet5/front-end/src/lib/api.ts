import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from "./auth-storage";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const api = axios.create({ baseURL });

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    setStoredTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch {
    clearStoredSession();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
