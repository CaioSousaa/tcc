"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/Alert";
import { toApiError, type ApiError } from "@/lib/api";
import { canDeleteComment, canEditComment, commentFailureAction, type CommentOperation } from "@/lib/comments";
import { MESSAGES } from "@/lib/messages";
import type { BoardRole } from "@/lib/permissions";
import { commentService, type CommentView } from "@/services/commentService";
import { CommentComposer } from "./CommentComposer";
import { CommentItem } from "./CommentItem";
import { DeleteCommentDialog } from "./DeleteCommentDialog";

type Props = {
  boardId: string;
  cardId: string;
  initialComments: CommentView[];
  currentUser: { id: string; name: string } | null;
  myRole: BoardRole;
  /** Saved count after publishing or deleting; the board page updates the face (F128). */
  onCountChange: (count: number) => void;
  /** Board or card is gone; the board page handles it (CA31, CB15). */
  onCardGone: (error: ApiError) => void;
  /** The role changed elsewhere; the board page reloads the board (CB14). */
  onForbidden: () => void;
};

/**
 * "Comentários" in the card dialog (RF09 spec 2.1–2.6). Every action is saved
 * immediately, without optimistic update, and its response replaces the whole
 * history (F124, F126). Lives outside the card form (F134).
 */
export function CommentsSection({ boardId, cardId, initialComments, currentUser, myRole, onCountChange, onCardGone, onForbidden }: Props) {
  const titleId = useId();
  const [comments, setComments] = useState<CommentView[]>(initialComments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CommentView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scrollToId, setScrollToId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  // "hoje"/"ontem" are computed when the section renders (spec 2.2).
  const now = new Date();

  useEffect(() => {
    if (!scrollToId) return;
    itemRefs.current.get(scrollToId)?.scrollIntoView({ block: "nearest" });
    setScrollToId(null);
  }, [scrollToId]);

  function apply(next: CommentView[], countChanged: boolean) {
    setComments(next);
    if (countChanged) onCountChange(next.length);
  }

  async function reload() {
    try {
      apply(await commentService.list(boardId, cardId), true);
    } catch (error) {
      const apiError = toApiError(error);
      const action = commentFailureAction("update", apiError);
      if (action === "board-not-found" || action === "card-gone") onCardGone(apiError);
    }
  }

  /** Returns normally when handled here; rethrows when the field or confirmation must show it. */
  async function handleFailure(operation: CommentOperation, error: unknown) {
    const apiError = toApiError(error);
    switch (commentFailureAction(operation, apiError)) {
      case "board-not-found":
      case "card-gone":
        onCardGone(apiError);
        return;
      case "forbidden":
        setEditingId(null);
        setDeleting(null);
        setNotice(apiError.message);
        onForbidden();
        await reload();
        return;
      case "done-and-reload":
        setDeleting(null);
        await reload();
        return;
      case "reload-with-message":
        setEditingId(null);
        setNotice(apiError.message);
        await reload();
        return;
      default:
        throw error;
    }
  }

  async function publish(body: string): Promise<boolean> {
    setNotice(null);
    try {
      const result = await commentService.create(boardId, cardId, body);
      apply(result.comments, true);
      setScrollToId(result.comment.id);
      return true;
    } catch (error) {
      await handleFailure("create", error);
      return false;
    }
  }

  async function save(comment: CommentView, body: string) {
    setNotice(null);
    try {
      apply((await commentService.update(boardId, cardId, comment.id, body)).comments, false);
      setEditingId(null);
    } catch (error) {
      await handleFailure("update", error);
    }
  }

  async function confirmDelete(comment: CommentView) {
    setNotice(null);
    try {
      apply(await commentService.remove(boardId, cardId, comment.id), true);
      if (editingId === comment.id) setEditingId(null);
      setDeleting(null);
    } catch (error) {
      await handleFailure("delete", error);
    }
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h3 id={titleId} className="text-sm font-medium text-ink">
        {MESSAGES.commentsTitle}
      </h3>
      {notice ? <Alert>{notice}</Alert> : null}

      {comments.length === 0 ? (
        <p className="text-[15px] text-muted">{MESSAGES.commentsEmpty}</p>
      ) : (
        <ol aria-labelledby={titleId} className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              ref={(element) => {
                if (element) itemRefs.current.set(comment.id, element);
                else itemRefs.current.delete(comment.id);
              }}
              comment={comment}
              now={now}
              canEdit={canEditComment(comment, currentUser?.id)}
              canDelete={canDeleteComment(comment, currentUser?.id, myRole)}
              editing={editingId === comment.id}
              onStartEdit={(target) => setEditingId(target.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={save}
              onDelete={setDeleting}
            />
          ))}
        </ol>
      )}

      <CommentComposer currentUser={currentUser} onPublish={publish} />

      {deleting ? <DeleteCommentDialog onCancel={() => setDeleting(null)} onConfirm={() => confirmDelete(deleting)} /> : null}
    </section>
  );
}
