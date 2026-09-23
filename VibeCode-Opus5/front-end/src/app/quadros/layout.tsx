import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthGuard } from "@/components/AuthGuard";

export default function QuadrosLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 px-6 py-12">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
