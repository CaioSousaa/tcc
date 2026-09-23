import { MESSAGES } from "@/lib/messages";
import type { BoardListItem } from "@/services/boardService";
import { AddListButton } from "./AddListButton";
import { ListColumn, type ListCardActions } from "./ListColumn";

type Props = {
  lists: BoardListItem[];
  onAdd: () => void;
  onEdit: (list: BoardListItem) => void;
  onDelete: (list: BoardListItem) => void;
  /** "Adicionar lista" and list actions only for roles that manage lists (RF07 F89, CA29). */
  canManage: boolean;
  cardActions: ListCardActions;
};

/**
 * Lists side by side in saved order, with "Adicionar lista" after the last one.
 * The strip scrolls horizontally on its own, so the board header stays in view (spec 2.1, N58).
 */
export function BoardLists({ lists, onAdd, onEdit, onDelete, canManage, cardActions }: Props) {
  const ordered = [...lists].sort((a, b) => a.position - b.position);

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[15px] text-muted">{MESSAGES.noLists}</p>
        {canManage ? <AddListButton onClick={onAdd} /> : null}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <ol className="flex items-start gap-5" aria-label="Listas do quadro">
        {ordered.map((list) => (
          <li key={list.id}>
            <ListColumn list={list} onEdit={onEdit} onDelete={onDelete} canManage={canManage} cardActions={cardActions} />
          </li>
        ))}
        {canManage ? (
          <li>
            <AddListButton onClick={onAdd} />
          </li>
        ) : null}
      </ol>
    </div>
  );
}
