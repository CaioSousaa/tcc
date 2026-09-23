"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreateBoardForm } from "./CreateBoardForm";

interface Board {
  id: string;
  name: string;
  listCount: number;
  cardCount: number;
  role: string;
}

const BOARD_COLORS = [
  "border-blue-400",
  "border-green-400",
  "border-purple-400",
  "border-orange-400",
];

interface BoardsListProps {
  searchTerm?: string;
}

export function BoardsList({ searchTerm = "" }: BoardsListProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBoards = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/boards", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar quadros");
        }

        const data = await response.json();
        setBoards(
          (data.boards ?? []).map((b: { id: string; name: string; column_count: number; card_count: number }) => ({
            id: b.id,
            name: b.name,
            listCount: b.column_count,
            cardCount: b.card_count,
            role: "admin",
          }))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Carregando quadros...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus quadros</h1>
          <p className="text-gray-600">
            {boards.length} quadro{boards.length !== 1 ? "s" : ""} · você é administrador{boards.filter(b => b.role === "admin").length > 1 ? " em" : ""} em {boards.filter(b => b.role === "admin").length}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900"
        >
          + Novo quadro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredBoards.map((board, index) => (
          <Link
            key={board.id}
            href={`/boards/${board.id}`}
            className={`bg-white rounded-lg border-t-4 ${BOARD_COLORS[index % BOARD_COLORS.length]} shadow hover:shadow-lg transition p-4 cursor-pointer`}
          >
            <h3 className="font-bold text-lg mb-2 truncate">{board.name}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {board.listCount} lista{board.listCount !== 1 ? "s" : ""} · {board.cardCount} card{board.cardCount !== 1 ? "s" : ""}
            </p>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {board.role === "admin" ? "ADMIN" : "MEMBRO"}
            </div>
          </Link>
        ))}

        <button
          onClick={() => setShowCreate(true)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">+</div>
            <span>Criar quadro</span>
          </div>
        </button>
      </div>

      {showCreate && (
        <CreateBoardForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchBoards();
          }}
        />
      )}
    </div>
  );
}
