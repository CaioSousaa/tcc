import { MESSAGES } from "@/lib/messages";

export function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 items-center justify-center py-24">
      <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Failure is never shown as an empty result (CE01). */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-[15px] text-ink">{MESSAGES.unexpected}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Tentar novamente
      </button>
    </div>
  );
}
