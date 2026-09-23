import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 py-16 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1c3557] text-sm font-semibold text-white">
              K
            </span>
            <span className="text-lg font-bold text-slate-900">Kanbo</span>
          </Link>
          {children}
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-[#1c3557] lg:px-16">
        <p className="max-w-md text-2xl leading-relaxed text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e
          comentários no mesmo lugar.
        </p>
      </div>
    </div>
  );
}
