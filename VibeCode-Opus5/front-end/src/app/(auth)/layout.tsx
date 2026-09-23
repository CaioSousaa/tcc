import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
      <aside className="hidden items-center bg-navy px-16 lg:flex">
        <p className="max-w-md text-[26px] leading-relaxed font-medium text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e
          comentários no mesmo lugar.
        </p>
      </aside>
    </div>
  );
}
