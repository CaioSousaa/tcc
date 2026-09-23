import type { ReactNode } from "react";
import { Logo } from "./Logo";

/** Two-panel layout from prototipo/paginas/tela-login.png and criar-conta.png (F8). */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <main className="flex w-full flex-col justify-center bg-surface px-6 py-12 lg:w-[48%] lg:px-0">
        <div className="mx-auto w-full max-w-[490px]">
          <Logo />
          <h1 className="mt-10 text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <aside className="hidden flex-1 items-center bg-brand px-16 lg:flex">
        <p className="mx-auto max-w-md text-2xl leading-relaxed text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no mesmo lugar.
        </p>
      </aside>
    </div>
  );
}
