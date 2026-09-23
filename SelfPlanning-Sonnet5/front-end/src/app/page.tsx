"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/quadros" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-zinc-500">Carregando...</p>
    </div>
  );
}
