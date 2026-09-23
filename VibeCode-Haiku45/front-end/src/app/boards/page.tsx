"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useBoardApi, Board } from "@/hooks/useBoardApi";
import { BoardForm } from "@/components/BoardForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Boards() {
  const { user, logout } = useAuth();
  const { getBoards, createBoard, updateBoard, deleteBoard } = useBoardApi();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      const data = await getBoards();
      setBoards(data);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar quadros";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSubmit = async (data: { title: string; description?: string; color?: string }) => {
    try {
      if (editingBoard) {
        const updated = await updateBoard(editingBoard.id, data);
        setBoards(boards.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const newBoard = await createBoard(data.title, data.description, data.color);
        setBoards([newBoard, ...boards]);
      }
      setShowForm(false);
      setEditingBoard(undefined);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (boardId: string) => {
    try {
      await deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
      setDeleteConfirm(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar quadro";
      setError(errorMessage);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="text-xl font-semibold text-gray-900">Kanbo</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-700">Bem-vindo, {user?.name}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 rounded-lg transition"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Meus Quadros</h1>
            <button
              onClick={() => {
                setEditingBoard(undefined);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
            >
              Novo Quadro
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Boards Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Carregando quadros...</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block">
                <svg
                  className="w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum quadro criado</h3>
                <p className="text-gray-600 mb-6">Comece criando seu primeiro quadro para organizar suas tarefas.</p>
                <button
                  onClick={() => {
                    setEditingBoard(undefined);
                    setShowForm(true);
                  }}
                  className="px-6 py-2 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
                >
                  Criar Primeiro Quadro
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 overflow-hidden"
                  style={{ borderLeftColor: board.color }}
                >
                  <Link href={`/boards/${board.id}`} className="block p-6 hover:bg-gray-50 transition">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{board.title}</h3>
                    {board.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{board.description}</p>
                    )}
                  </Link>
                  <div className="flex gap-2 p-4 pt-0 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setEditingBoard(board);
                        setShowForm(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 rounded transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(board.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Board Form Modal */}
        {showForm && (
          <BoardForm
            board={editingBoard}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingBoard(undefined);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deletar Quadro?</h2>
              <p className="text-gray-600 mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const boardId = deleteConfirm;
                    setDeleteConfirm(null);
                    handleDelete(boardId);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  Deletar
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
