import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

let refreshRequest: Promise<void> | null = null;

/** Single in-flight refresh shared by every request that hit a 401 at the same time. */
function refreshSession(): Promise<void> {
  if (!refreshRequest) {
    refreshRequest = api
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const url = config?.url ?? "";
    const shouldRefresh =
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      !AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) =>
        url.startsWith(endpoint),
      );

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      await refreshSession();
    } catch {
      return Promise.reject(error);
    }

    return api.request(config as AxiosRequestConfig);
  },
);
