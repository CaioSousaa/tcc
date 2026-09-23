"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ColumnList } from "@/components/ColumnList";
import { MembersModal } from "@/components/MembersModal";
import { LabelsModal } from "@/components/LabelsModal";
import { useMembers } from "@/hooks/useMembers";
import LabelFilter from "@/components/LabelFilter";
import { useCardLabelFilter } from "@/hooks/useCardLabelFilter";

const AVATAR_COLORS = ["bg-blue-400", "bg-purple-400", "bg-green-400", "bg-orange-400", "bg-pink-400"];

interface Board {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function BoardContent({ boardId }: { boardId: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { members, refetch: refetchMembers } = useMembers(boardId);
  const [showMembers, setShowMembers] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [labelsVersion, setLabelsVersion] = useState(0);
  const { selectedLabelIds, toggleLabel, clearFilter } = useCardLabelFilter(boardId);
  const router = useRouter();

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/boards/${boardId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Quadro não encontrado");
            return;
          }
          throw new Error("Erro ao carregar quadro");
        }

        const data = await response.json();
        setBoard(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

  useEffect(() => {
    refetchMembers();
  }, [refetchMembers]);

  if (loading) {
    return <div className="text-center py-12">Carregando quadro...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!board) {
    return <div className="text-center py-12">Quadro não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-950 hover:underline font-medium text-sm"
              >
                ← Quadros
              </button>
              <span className="text-gray-400">·</span>
              <h1 className="text-xl font-bold">{board.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLabels(true)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Etiquetas
              </button>
              <button
                onClick={() => setShowMembers(true)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Membros
              </button>
              <button
                onClick={() => setShowMembers(true)}
                className="flex -space-x-2"
                title="Ver membros"
              >
                {members.slice(0, 5).map((member, i) => (
                  <div
                    key={member.id}
                    className={`w-8 h-8 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
                    title={member.name}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white">
                    +{members.length - 5}
                  </div>
                )}
              </button>
            </div>
          </div>

          <LabelFilter
            key={labelsVersion}
            boardId={boardId}
            selectedLabelIds={selectedLabelIds}
            onToggle={toggleLabel}
            onClear={clearFilter}
          />
        </div>
      </nav>

      <main className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ColumnList
          boardId={boardId}
          selectedLabelIds={selectedLabelIds}
          refreshToken={labelsVersion}
        />
      </main>

      {showMembers && (
        <MembersModal
          boardId={boardId}
          onClose={() => {
            setShowMembers(false);
            refetchMembers();
          }}
        />
      )}

      {showLabels && (
        <LabelsModal
          boardId={boardId}
          onClose={() => {
            setShowLabels(false);
            setLabelsVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}

export default function BoardPage() {
  const params = useParams();
  const boardId = typeof params.id === "string" ? params.id : "";

  return (
    <ProtectedRoute>
      <BoardContent boardId={boardId} />
    </ProtectedRoute>
  );
}
