"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MembersPanel from "@/components/MembersPanel";
import { useAuth } from "@/hooks/useAuth";
import { useMyRole } from "@/hooks/useMyRole";

export default function BoardMembersPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { user } = useAuth();
  const { role, loading: roleLoading } = useMyRole(boardId);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Você precisa estar logado.</p>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Apenas administradores podem gerenciar membros.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Membros</h1>
      <MembersPanel boardId={boardId} />
    </div>
  );
}
