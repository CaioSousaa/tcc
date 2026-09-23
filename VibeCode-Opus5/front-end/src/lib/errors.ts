import { AxiosError } from "axios";

export interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string>;
}

export interface ParsedApiError {
  message: string;
  fields: Record<string, string>;
}

const FALLBACK_MESSAGE = "Não foi possível concluir. Tente novamente.";

export function parseApiError(error: unknown): ParsedApiError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        message: "Servidor indisponível. Verifique sua conexão.",
        fields: {},
      };
    }

    const body = error.response.data as ApiErrorBody | undefined;

    return {
      message: body?.message ?? FALLBACK_MESSAGE,
      fields: body?.fields ?? {},
    };
  }

  return { message: FALLBACK_MESSAGE, fields: {} };
}
