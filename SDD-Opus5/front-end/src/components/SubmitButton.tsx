import type { ReactNode } from "react";

/** Disabled with a busy indicator while the request is in flight (CA27, CE03). */
export function SubmitButton({ loading, loadingLabel, children }: { loading: boolean; loadingLabel: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-80"
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
