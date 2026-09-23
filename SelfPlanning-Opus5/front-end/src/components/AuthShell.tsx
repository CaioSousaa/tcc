import { Logo } from "./Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />

          <h1 className="mt-10 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </section>

      <aside className="flex items-center bg-brand px-10 py-16 lg:w-1/2">
        <p className="max-w-md text-2xl leading-relaxed font-medium text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no
          mesmo lugar.
        </p>
      </aside>
    </div>
  );
}
