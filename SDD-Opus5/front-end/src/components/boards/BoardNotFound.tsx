import Link from "next/link";
import { MESSAGES } from "@/lib/messages";

/** Same result for a missing board and one from another account (CA21, CA22, RN03). */
export function BoardNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">{MESSAGES.boardNotFound}</h1>
      <Link
        href="/boards"
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Voltar para Meus quadros
      </Link>
    </main>
  );
}
