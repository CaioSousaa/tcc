import type { ReactNode } from "react";

export function Alert({ tone = "error", children }: { tone?: "error" | "info"; children: ReactNode }) {
  const styles =
    tone === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-brand/20 bg-brand/5 text-brand";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
