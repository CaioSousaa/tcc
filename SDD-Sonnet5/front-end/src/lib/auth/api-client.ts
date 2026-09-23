import axios from "axios";

const AUTH_ENDPOINTS_SKIPPING_RETRY = ["/auth/refresh", "/auth/login", "/auth/register"];

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333",
  withCredentials: true,
});

let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let pendingRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!pendingRefresh) {
    pendingRefresh = apiClient
      .post<{ accessToken: string }>("/auth/refresh")
      .then((response) => response.data.accessToken)
      .catch(() => null)
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url: string | undefined = original?.url;
    const isAuthFlowEndpoint = url ? AUTH_ENDPOINTS_SKIPPING_RETRY.some((e) => url.includes(e)) : false;

    if (error.response?.status === 401 && original && !original._retry && !isAuthFlowEndpoint) {
      original._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      }
      setAccessToken(null);
      onUnauthenticated?.();
    }

    return Promise.reject(error);
  },
);
