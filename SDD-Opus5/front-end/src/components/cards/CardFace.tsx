import { ChecklistProgress } from "@/components/checklist/ChecklistProgress";
import { CommentIcon } from "@/components/comments/icons";
import { LabelChip } from "@/components/labels/LabelChip";
import { AvatarStack } from "@/components/members/AvatarStack";
import { checklistProgress } from "@/lib/checklist";
import { commentCountLabel } from "@/lib/comments";
import { localToday } from "@/lib/dueDate";
import { resolveLabels } from "@/lib/labels";
import { CARD_AVATARS_MAX, resolveAssignees } from "@/lib/members";
import { DueDateBadge } from "./DueDateBadge";
import type { BoardMember, CardSummary } from "@/services/boardService";
import type { LabelView } from "@/services/labelService";

type Props = {
  card: CardSummary;
  /** Participants of the board, to resolve the assignees (RF07 F94). */
  members: readonly BoardMember[];
  /** Labels of the board, to resolve the card labels in label order (RF08 F111). */
  labels: readonly LabelView[];
  onOpen: (card: CardSummary) => void;
};

/**
 * Face of a card: labels above the title (RF08 spec 2.6), full title, checklist progress when there are items (RF06 spec 2.6)
 * and up to 3 assignee avatars with "+K" at the bottom right (RF07 spec 2.9).
 */
export function CardFace({ card, members, labels, onOpen }: Props) {
  const applied = resolveLabels(card.labelIds, labels);
  // Status computed with the device's today at render time (RF10 F145).
  const today = localToday(new Date());
  const progress = checklistProgress(card.checklistDone, card.checklistTotal);
  const assignees = resolveAssignees(card.assigneeIds, members);

  return (
    <button
      type="button"
      onClick={() => onOpen(card)}
      className="flex w-full flex-col gap-2.5 rounded-lg border border-line bg-white px-4 py-3 text-left text-[15px] leading-snug text-ink shadow-sm transition hover:border-brand/40 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {applied.length > 0 ? (
        <span className="flex flex-wrap gap-1.5">
          {applied.map((label) => (
            <LabelChip key={label.id} name={label.name} color={label.color} />
          ))}
        </span>
      ) : null}
      <span className="block break-words [overflow-wrap:anywhere]">{card.title}</span>
      {progress ? <ChecklistProgress progress={progress} variant="face" /> : null}
      {card.dueDate !== null || card.commentCount > 0 || assignees.length > 0 ? (
        <span className="flex items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2">
            {/* Due date status left of the comment count (RF10 spec 2.4). */}
            <DueDateBadge dueDate={card.dueDate} today={today} />
            {card.commentCount > 0 ? (
              // Comment count in the footer (RF09 spec 2.7, N195).
              <span aria-label={commentCountLabel(card.commentCount)} className="flex items-center gap-1 text-xs text-muted">
                <CommentIcon />
                <span aria-hidden="true">{card.commentCount}</span>
              </span>
            ) : null}
          </span>
          {assignees.length > 0 ? <AvatarStack people={assignees} max={CARD_AVATARS_MAX} size="xs" /> : null}
        </span>
      ) : null}
    </button>
  );
}
