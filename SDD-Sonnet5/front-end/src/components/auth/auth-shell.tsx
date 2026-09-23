import { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-1">
      <div className="flex w-full flex-1 flex-col justify-center gap-8 px-6 py-12 sm:px-12 lg:px-24 xl:w-1/2 xl:flex-none">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Logo />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          {children}
          <div className="text-center text-sm text-muted">{footer}</div>
        </div>
      </div>
      <div className="relative hidden flex-1 items-center bg-brand px-16 xl:flex">
        <p className="max-w-md text-2xl leading-snug text-white/90">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no
          mesmo lugar.
        </p>
      </div>
    </div>
  );
}
