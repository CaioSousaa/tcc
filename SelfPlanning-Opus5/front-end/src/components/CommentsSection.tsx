"use client";

import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { FormMessage } from "./FormMessage";
import {
  Comment,
  createCommentRequest,
  deleteCommentRequest,
  listCommentsRequest,
  updateCommentRequest,
} from "@/lib/commentsApi";
import { formatCommentDate } from "@/lib/dateLabels";
import { getErrorMessage } from "@/lib/errors";

interface CommentsSectionProps {
  boardId: string;
  cardId: string;
  currentUserId: string | null;
  isAdmin: boolean;
  onCountChange: (cardId: string, count: number) => void;
}

export function CommentsSection({
  boardId,
  cardId,
  currentUserId,
  isAdmin,
  onCountChange,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;

    listCommentsRequest(boardId, cardId)
      .then((loaded) => {
        if (active) {
          setComments(loaded);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getErrorMessage(loadError, "Não foi possível carregar os comentários."));
        }
      });

    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  async function run(
    action: () => Promise<Comment[]>,
    fallback: string
  ): Promise<boolean> {
    setError("");
    setIsBusy(true);

    try {
      const updated = await action();

      setComments(updated);
      onCountChange(cardId, updated.length);

      return true;
    } catch (actionError) {
      setError(getErrorMessage(actionError, fallback));

      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreate(): Promise<void> {
    const text = newText.trim();

    if (text.length === 0) {
      return;
    }

    const succeeded = await run(
      () => createCommentRequest(boardId, cardId, text),
      "Não foi possível publicar o comentário."
    );

    if (succeeded) {
      setNewText("");
    }
  }

  async function handleUpdate(comment: Comment): Promise<void> {
    const text = editingText.trim();

    setEditingId(null);

    if (text.length === 0 || text === comment.text) {
      return;
    }

    await run(
      () => updateCommentRequest(boardId, cardId, comment.id, text),
      "Não foi possível salvar o comentário."
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Comentários</h3>

      <ul className="flex flex-col gap-4">
        {comments.map((comment) => {
          const isAuthor = comment.authorId === currentUserId;

          return (
            <li key={comment.id} className="flex gap-3">
              <Avatar
                name={comment.authorName}
                email={comment.authorEmail ?? ""}
                size="sm"
              />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.authorName ?? comment.authorEmail}
                  </span>
                  <span className="text-xs text-muted">
                    {formatCommentDate(comment.createdAt)}
                    {comment.edited ? " · editado" : ""}
                  </span>
                </p>

                {editingId === comment.id ? (
                  <textarea
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    onBlur={() => void handleUpdate(comment)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    rows={3}
                    maxLength={2000}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                ) : (
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground">{comment.text}</p>
                )}

                {isAuthor || isAdmin ? (
                  <div className="mt-1 flex gap-3">
                    {isAuthor ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingText(comment.text);
                        }}
                        className="text-xs text-muted transition-colors hover:text-foreground"
                      >
                        Editar
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        void run(
                          () => deleteCommentRequest(boardId, cardId, comment.id),
                          "Não foi possível excluir o comentário."
                        )
                      }
                      className="text-xs text-muted transition-colors hover:text-red-700"
                    >
                      Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}

        {comments.length === 0 ? (
          <li className="text-xs text-muted">Nenhum comentário ainda.</li>
        ) : null}
      </ul>

      <div className="flex flex-col gap-2">
        <textarea
          value={newText}
          onChange={(event) => setNewText(event.target.value)}
          placeholder="Escreva um comentário"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isBusy || newText.trim().length === 0}
          className="h-10 w-fit rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          Comentar
        </button>
      </div>

      {error ? <FormMessage message={error} /> : null}
    </section>
  );
}
