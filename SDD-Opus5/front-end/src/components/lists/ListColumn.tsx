import { PencilIcon, TrashIcon } from "@/components/boards/icons";
import { AddCardButton } from "@/components/cards/AddCardButton";
import { AddCardForm } from "@/components/cards/AddCardForm";
import { CardFace } from "@/components/cards/CardFace";
import { MESSAGES } from "@/lib/messages";
import type { BoardListItem, BoardMember, CardSummary } from "@/services/boardService";
import type { LabelView } from "@/services/labelService";

export type ListCardActions = {
  addingListId: string | null;
  onStartAdd: (listId: string) => void;
  onCancelAdd: () => void;
  onAddCard: (listId: string, title: string) => Promise<void>;
  onOpenCard: (card: CardSummary) => void;
  /** Participants, to show assignee avatars on the faces (RF07 F94). */
  members: readonly BoardMember[];
  /** Labels of the board, to show label chips on the faces (RF08 F111). */
  labels: readonly LabelView[];
  /** List that just received a card hidden by the label filter (RF08 F115). */
  hiddenCardListId: string | null;
};

type Props = {
  list: BoardListItem;
  onEdit: (list: BoardListItem) => void;
  onDelete: (list: BoardListItem) => void;
  /** Edit and delete are shown only when the role may manage lists (RF07 F89). */
  canManage: boolean;
  cardActions: ListCardActions;
};

const actionClass =
  "flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

/** Column from prototipo/paginas/quadro.png: header (RF03), cards in order and "Adicionar card" (RF04 spec 2.1). */
export function ListColumn({ list, onEdit, onDelete, canManage, cardActions }: Props) {
  const adding = cardActions.addingListId === list.id;

  return (
    <section
      aria-label={list.name}
      className="flex w-[320px] shrink-0 flex-col rounded-xl border border-line bg-white/70 p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="break-words font-semibold text-ink [overflow-wrap:anywhere]">{list.name}</h2>
          <span className="shrink-0 text-sm text-muted" aria-label={`${list.cardCount} cards`}>
            {list.cardCount}
          </span>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1.5">
            <button type="button" aria-label={`Editar lista ${list.name}`} onClick={() => onEdit(list)} className={actionClass}>
              <PencilIcon />
            </button>
            <button type="button" aria-label={`Excluir lista ${list.name}`} onClick={() => onDelete(list)} className={actionClass}>
              <TrashIcon />
            </button>
          </div>
        ) : null}
      </header>
      {list.cards.length > 0 ? (
        <ol className="mt-3 flex flex-col gap-2.5" aria-label={`Cards de ${list.name}`}>
          {[...list.cards]
            .sort((a, b) => a.position - b.position)
            .map((card) => (
              <li key={card.id}>
                <CardFace card={card} members={cardActions.members} labels={cardActions.labels} onOpen={cardActions.onOpenCard} />
              </li>
            ))}
        </ol>
      ) : null}

      {cardActions.hiddenCardListId === list.id ? (
        <p role="status" className="mt-3 rounded-lg bg-surface px-3 py-2 text-sm text-muted">
          {MESSAGES.cardHiddenByFilter}
        </p>
      ) : null}

      <div className="mt-3">
        {adding ? (
          <AddCardForm
            listName={list.name}
            onSubmit={(title) => cardActions.onAddCard(list.id, title)}
            onCancel={cardActions.onCancelAdd}
          />
        ) : (
          <AddCardButton onClick={() => cardActions.onStartAdd(list.id)} />
        )}
      </div>
    </section>
  );
}
