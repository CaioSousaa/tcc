"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { TrashIcon } from "@/components/icons";
import type { Comment } from "@/lib/comments";
import { parseApiError } from "@/lib/errors";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface CommentsSectionProps {
  comments: Comment[];
  currentUserId: string | undefined;
  currentUserName: string | undefined;
  onAdd: (body: string) => Promise<void>;
  onDelete: (comment: Comment) => Promise<void>;
}

export function CommentsSection({
  comments,
  currentUserId,
  currentUserName,
  onAdd,
  onDelete,
}: CommentsSectionProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmed = body.trim();

    if (!trimmed) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onAdd(trimmed);
      setBody("");
    } catch (submitError) {
      setError(parseApiError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(comment: Comment) {
    setError("");

    try {
      await onDelete(comment);
    } catch (deleteError) {
      setError(parseApiError(deleteError).message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">
        Comentários
      </span>

      {comments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="group flex gap-2.5">
              <Avatar seed={comment.authorId} name={comment.authorName} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-medium">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-muted">
                    {dateFormatter.format(new Date(comment.createdAt))}
                  </span>

                  {comment.authorId === currentUserId ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment)}
                      aria-label="Excluir comentário"
                      title="Excluir"
                      className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                    >
                      <TrashIcon />
                    </button>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-[15px] text-foreground">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nenhum comentário ainda.</p>
      )}

      <div className="flex gap-2.5">
        <Avatar seed={currentUserId ?? ""} name={currentUserName ?? null} />

        <div className="flex w-full flex-col gap-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={2}
            placeholder="Escreva um comentário"
            className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/15"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !body.trim()}
            className="self-start rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            Comentar
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
