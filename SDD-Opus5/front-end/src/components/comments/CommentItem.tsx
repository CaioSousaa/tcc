import { forwardRef } from "react";
import { Avatar } from "@/components/members/Avatar";
import { formatCommentMoment, fullCommentMoment } from "@/lib/commentTime";
import { MESSAGES } from "@/lib/messages";
import type { CommentView } from "@/services/commentService";
import { CommentEditForm } from "./CommentEditForm";

type Props = {
  comment: CommentView;
  now: Date;
  canEdit: boolean;
  canDelete: boolean;
  editing: boolean;
  onStartEdit: (comment: CommentView) => void;
  onCancelEdit: () => void;
  onSave: (comment: CommentView, body: string) => Promise<void>;
  onDelete: (comment: CommentView) => void;
};

const actionClass = "text-xs font-medium text-muted underline-offset-2 transition hover:text-ink hover:underline";

/**
 * Avatar, author, moment, "(editado)", text and allowed actions (RF09 spec 2.1).
 * The text is only ever a React text child with pre-wrap: no HTML, no links (F130).
 */
export const CommentItem = forwardRef<HTMLLIElement, Props>(function CommentItem(
  { comment, now, canEdit, canDelete, editing, onStartEdit, onCancelEdit, onSave, onDelete },
  ref,
) {
  const full = fullCommentMoment(comment.createdAt);

  return (
    <li ref={ref} className="flex gap-3">
      <Avatar name={comment.author.name} colorKey={comment.author.userId} size="md" decorative />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="break-words font-semibold text-ink [overflow-wrap:anywhere]">{comment.author.name}</span>
          <span className="text-xs text-muted">
            <time dateTime={comment.createdAt} title={full} aria-label={full}>
              {formatCommentMoment(comment.createdAt, now)}
            </time>
            {comment.edited ? ` ${MESSAGES.commentEdited}` : null}
          </span>
        </p>

        {editing ? (
          <div className="mt-2">
            <CommentEditForm initialBody={comment.body} onCancel={onCancelEdit} onSave={(body) => onSave(comment, body)} />
          </div>
        ) : (
          <>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink [overflow-wrap:anywhere]">{comment.body}</p>
            {canEdit || canDelete ? (
              <div className="mt-1 flex gap-3">
                {canEdit ? (
                  <button type="button" aria-label={`Editar comentário de ${comment.author.name}`} onClick={() => onStartEdit(comment)} className={actionClass}>
                    Editar
                  </button>
                ) : null}
                {canDelete ? (
                  <button type="button" aria-label={`Excluir comentário de ${comment.author.name}`} onClick={() => onDelete(comment)} className={actionClass}>
                    Excluir
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
});
