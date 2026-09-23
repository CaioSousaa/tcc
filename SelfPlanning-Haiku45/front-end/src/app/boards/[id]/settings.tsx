"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getBoardById, updateBoard, deleteBoard } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Board {
  id: string;
  titulo: string;
  descricao?: string;
  corFundo: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

function BoardDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [corFundo, setCorFundo] = useState("#3b82f6");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  async function loadBoard() {
    try {
      const response = await getBoardById(boardId);
      setBoard(response.data);
      setTitulo(response.data.titulo);
      setDescricao(response.data.descricao || "");
      setCorFundo(response.data.corFundo);
      setError("");
    } catch (err) {
      setError("Quadro não encontrado");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!titulo.trim()) {
        setError("Título é obrigatório");
        setSaving(false);
        return;
      }

      if (titulo.length > 100) {
        setError("Título deve ter no máximo 100 caracteres");
        setSaving(false);
        return;
      }

      const updated = await updateBoard(boardId, titulo, descricao || undefined, corFundo);
      setBoard(updated.data);
      setError("");
    } catch (err) {
      setError("Erro ao atualizar quadro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar este quadro?")) return;

    try {
      await deleteBoard(boardId);
      router.push("/boards");
    } catch (err) {
      setError("Erro ao deletar quadro");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">Carregando...</div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
        <header className="bg-white dark:bg-zinc-900 shadow">
          <nav className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:underline"
            >
              ← Voltar
            </button>
          </nav>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push("/boards")}
              className="text-blue-600 hover:underline"
            >
              Voltar para quadros
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 shadow">
        <nav className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/boards/${boardId}`)}
            className="text-blue-600 hover:underline"
          >
            ← Voltar
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
            Editar Quadro
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Título *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-1">{titulo.length}/100</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Cor de Fundo
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={corFundo}
                  onChange={(e) => setCorFundo(e.target.value)}
                  className="h-12 w-20 rounded-md cursor-pointer"
                />
                <div
                  className="h-12 w-32 rounded-md shadow-md"
                  style={{ backgroundColor: corFundo }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
              >
                Deletar
              </button>
              <button
                type="button"
                onClick={() => router.push("/boards")}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function BoardDetailsPage() {
  return (
    <ProtectedRoute>
      <BoardDetailsContent />
    </ProtectedRoute>
  );
}
