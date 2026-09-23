"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession } = useAuth();

  useEffect(() => {
    if (isLoadingSession) {
      return;
    }

    router.replace(isAuthenticated ? "/quadros" : "/login");
  }, [isAuthenticated, isLoadingSession, router]);

  return null;
}
