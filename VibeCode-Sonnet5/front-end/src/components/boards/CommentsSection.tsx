"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Comment, createComment, fetchComments } from "@/lib/comments";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CommentsSectionProps {
  boardId: string;
  cardId: string;
}

export function CommentsSection({ boardId, cardId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setComments(await fetchComments(boardId, cardId));
    } catch {
      setError("Não foi possível carregar os comentários.");
    } finally {
      setLoading(false);
    }
  }, [boardId, cardId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const comment = await createComment(boardId, cardId, text.trim());
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch {
      setError("Não foi possível publicar o comentário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Comentários
      </span>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Carregando comentários...
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">
                {initials(comment.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatTimestamp(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">
          {user ? initials(user.name) : ""}
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <textarea
            value={text}
            disabled={submitting}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escreva um comentário"
            rows={2}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="self-start rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Comentar
          </button>
        </div>
      </form>
    </div>
  );
}
