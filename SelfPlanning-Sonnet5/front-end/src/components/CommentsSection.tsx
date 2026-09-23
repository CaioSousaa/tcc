"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/avatar";
import { Comment } from "@/lib/comments";

interface CommentsSectionProps {
  boardId: string;
  cardId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function CommentsSection({ boardId, cardId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const basePath = `/boards/${boardId}/cards/${cardId}/comments`;

  useEffect(() => {
    let active = true;
    api.get(basePath).then((response) => {
      if (active) {
        setComments(response.data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;

    setPosting(true);
    try {
      const response = await api.post(basePath, { text: text.trim() });
      setComments((prev) => [...prev, response.data]);
      setText("");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(comment: Comment) {
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    await api.delete(`${basePath}/${comment.id}`);
  }

  return (
    <div className="mb-2">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">Comentários</span>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando comentários...</p>
      ) : (
        <div className="mb-3 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1c3557] text-[10px] font-semibold text-white">
                {getInitials(comment.author.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                  {comment.author.id === user?.id && (
                    <button
                      onClick={() => handleDelete(comment)}
                      className="ml-auto text-xs text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                    >
                      excluir
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700">{comment.text}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-slate-400">Nenhum comentário ainda</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1c3557] text-[10px] font-semibold text-white">
          {user ? getInitials(user.name) : ""}
        </span>
        <div className="flex-1">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-md bg-[#1c3557] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
          >
            Comentar
          </button>
        </div>
      </form>
    </div>
  );
}
