"use client";

import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBoards, deleteBoard, updateBoard, getLists, getCards } from "@/lib/api";
import { NewBoardModal } from "@/components/NewBoardModal";
import Link from "next/link";

interface Board {
  id: string;
  titulo: string;
  descricao?: string;
  corFundo: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

interface BoardStats {
  listas: number;
  cards: number;
}

const TOP_BAR_COLORS = ["bg-blue-950", "bg-emerald-500", "bg-purple-500", "bg-orange-400"];

function BoardsContent() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [stats, setStats] = useState<Record<string, BoardStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    try {
      const response = await getBoards();
      setBoards(response.data);
      setError("");
      loadStats(response.data);
    } catch (err) {
      setError("Erro ao carregar quadros");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(boardsList: Board[]) {
    for (const board of boardsList) {
      try {
        const listsResp = await getLists(board.id);
        const cardsPerList = await Promise.all(
          listsResp.data.map((l: { id: string }) => getCards(board.id, l.id))
        );
        const cardsCount = cardsPerList.reduce((acc, r) => acc + r.data.length, 0);
        setStats((prev) => ({
          ...prev,
          [board.id]: { listas: listsResp.data.length, cards: cardsCount },
        }));
      } catch (err) {
        // quadro sem listas acessíveis, ignora estatística
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja deletar este quadro?")) return;

    try {
      await deleteBoard(id);
      setBoards(boards.filter((b) => b.id !== id));
    } catch (err) {
      setError("Erro ao deletar quadro");
    }
  }

  async function handleRename(board: Board) {
    const novoTitulo = window.prompt("Novo nome do quadro", board.titulo);
    if (!novoTitulo || !novoTitulo.trim() || novoTitulo === board.titulo) return;

    try {
      const resp = await updateBoard(board.id, novoTitulo);
      setBoards(boards.map((b) => (b.id === board.id ? resp.data : b)));
    } catch (err) {
      setError("Erro ao renomear quadro");
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleBoardCreated(board: Board) {
    setBoards((prev) => [...prev, board]);
    setShowNewBoardModal(false);
  }

  const initials = user?.email
    ?.split("@")[0]
    .split("")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const filteredBoards = boards.filter((board) =>
    board.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-950 rounded-lg flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-semibold text-lg">Kanbo</span>
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Buscar quadros e cards"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2"
            title="Sair"
          >
            <div className="w-8 h-8 rounded-full bg-blue-950 text-white flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user?.nome || user?.email}</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">Meus quadros</h1>
            <p className="text-gray-500">
              {boards.length} quadro{boards.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowNewBoardModal(true)}
            className="px-5 py-3 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 transition"
          >
            + Novo quadro
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando quadros...</div>
        ) : filteredBoards.length === 0 && searchTerm ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum quadro encontrado</p>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Você ainda não criou nenhum quadro.</p>
            <button
              onClick={() => setShowNewBoardModal(true)}
              className="text-blue-950 hover:underline font-medium"
            >
              Crie o seu primeiro quadro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBoards.map((board, index) => {
              const boardStats = stats[board.id];
              return (
                <div
                  key={board.id}
                  className="relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className={`h-1.5 ${TOP_BAR_COLORS[index % TOP_BAR_COLORS.length]}`} />
                  <Link href={`/boards/${board.id}`} className="block p-4 pb-3">
                    <h3 className="font-bold text-lg mb-1 pr-16">{board.titulo}</h3>
                    {board.descricao && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{board.descricao}</p>
                    )}
                    {boardStats && (
                      <p className="text-xs text-gray-500">
                        {boardStats.listas} lista{boardStats.listas !== 1 ? "s" : ""} · {boardStats.cards} card{boardStats.cards !== 1 ? "s" : ""}
                      </p>
                    )}
                  </Link>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => handleRename(board)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs"
                      title="Renomear"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(board.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-600 text-xs"
                      title="Excluir"
                    >
                      🗑
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-4 pb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-950 text-white text-[10px] flex items-center justify-center font-bold">
                      {initials}
                    </div>
                    <span className="text-[10px] tracking-wide text-gray-400 font-medium uppercase">Admin</span>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setShowNewBoardModal(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition min-h-32"
            >
              <div className="text-center">
                <div className="text-2xl mb-1">+</div>
                <span className="text-sm font-medium">Criar quadro</span>
              </div>
            </button>
          </div>
        )}
      </main>

      <NewBoardModal
        isOpen={showNewBoardModal}
        onClose={() => setShowNewBoardModal(false)}
        onCreated={handleBoardCreated}
      />
    </div>
  );
}

export default function BoardsPage() {
  return (
    <ProtectedRoute>
      <BoardsContent />
    </ProtectedRoute>
  );
}
