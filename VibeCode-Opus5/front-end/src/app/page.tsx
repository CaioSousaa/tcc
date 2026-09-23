"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    router.replace(user ? "/quadros" : "/login");
  }, [isLoading, user, router]);

  return (
    <div className="grid min-h-screen place-items-center text-sm text-muted">
      Carregando...
    </div>
  );
}
