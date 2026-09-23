"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BoardsList } from "@/components/BoardsList";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const initials = user?.email
    ?.split("@")[0]
    .split("")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-semibold text-lg">Kanbo</span>
          </div>
          <div className="flex items-center gap-4 flex-1 ml-8">
            <div className="flex-1 max-w-xs">
              <input
                type="search"
                placeholder="Buscar quadros e cards"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold hover:bg-blue-500 transition"
              title={user?.email}
            >
              {initials}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <BoardsList searchTerm={searchTerm} />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
