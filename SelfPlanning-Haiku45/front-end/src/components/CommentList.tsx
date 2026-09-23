import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  email: string;
  nome: string;
}

interface Comment {
  id: string;
  cardId: string;
  usuarioId: string;
  texto: string;
  dataCriacao: string;
  dataAtualizacao: string;
  usuario: User;
}

interface CommentListProps {
  comments: Comment[];
  onEdit: (commentId: string, texto: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  loading?: boolean;
}

export default function CommentList({
  comments,
  onEdit,
  onDelete,
  loading = false,
}: CommentListProps) {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  const handleEditStart = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.texto);
  };

  const handleEditSave = async (commentId: string) => {
    if (editText.trim().length === 0) {
      setError("Comentário não pode estar vazio");
      return;
    }

    try {
      await onEdit(commentId, editText);
      setEditingId(null);
      setEditText("");
      setError("");
    } catch (err) {
      setError("Erro ao editar comentário");
      console.error(err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Deletar comentário?")) return;
    try {
      await onDelete(commentId);
    } catch (err) {
      setError("Erro ao deletar comentário");
      console.error(err);
    }
  };

  if (comments.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum comentário ainda</p>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {comments.map((comment) => {
        const isAuthor = user?.id === comment.usuarioId;
        const isEditing = editingId === comment.id;
        const createdDate = new Date(comment.dataCriacao).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={comment.id} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded text-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-black dark:text-white">{comment.usuario.nome}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{createdDate}</p>
              </div>
              {isAuthor && (
                <div className="flex gap-1">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => handleEditStart(comment)}
                        disabled={loading}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={loading}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Deletar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={1000}
                  className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-700 text-black dark:text-white text-sm resize-none mb-2"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSave(comment.id)}
                    disabled={loading}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    className="px-3 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-black dark:text-white whitespace-pre-wrap">{comment.texto}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
