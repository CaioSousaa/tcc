"use client";

import type { ReactNode } from "react";

interface SubmitButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
}

export function SubmitButton({
  children,
  isLoading = false,
  loadingLabel = "Aguarde...",
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full rounded-lg bg-navy px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? loadingLabel : children}
    </button>
  );
}
