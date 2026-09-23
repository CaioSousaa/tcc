import { isAxiosError } from "axios";

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

const DEFAULT_ERROR: ApiError = {
  code: "unknown_error",
  message: "Algo deu errado. Tente novamente.",
};

export function parseApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: ApiError } | undefined;
    if (data?.error) {
      return data.error;
    }
  }
  return DEFAULT_ERROR;
}
