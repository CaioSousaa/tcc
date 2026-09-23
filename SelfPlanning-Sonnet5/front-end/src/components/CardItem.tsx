import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Card } from "@/lib/cards";
import { LABEL_COLOR_CHIP_CLASSES } from "@/lib/labels";

interface CardItemProps {
  card: Card;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpen: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function CardItem({ card, canMoveUp, canMoveDown, onOpen, onMoveUp, onMoveDown }: CardItemProps) {
  return (
    <div
      onClick={onOpen}
      className="group mb-2 cursor-pointer rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:border-slate-300"
    >
      {card.labels && card.labels.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${LABEL_COLOR_CHIP_CLASSES[label.color]}`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <span className="break-words">{card.title}</span>
        <div className="flex shrink-0 flex-col opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            aria-label="Mover card para cima"
            className="rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            aria-label="Mover card para baixo"
            className="rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {card.checklist && card.checklist.total > 0 && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.round((card.checklist.done / card.checklist.total) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-medium text-slate-500">
            {card.checklist.done}/{card.checklist.total}
          </span>
        </div>
      )}

      {card.dueDate && (
        <span
          className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            card.isOverdue ? "bg-red-100 text-red-700" : "bg-zinc-100 text-slate-500"
          }`}
        >
          <Clock className="h-3 w-3" />
          {card.isOverdue
            ? `Atrasado há ${card.overdueDays} ${card.overdueDays === 1 ? "dia" : "dias"}`
            : `Vence ${formatDueDate(card.dueDate)}`}
        </span>
      )}
    </div>
  );
}
