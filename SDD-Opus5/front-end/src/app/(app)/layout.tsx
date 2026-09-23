import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SearchProvider>
        <ProtectedShell>{children}</ProtectedShell>
      </SearchProvider>
    </AuthProvider>
  );
}
