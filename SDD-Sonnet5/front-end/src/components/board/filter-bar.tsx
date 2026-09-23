"use client";

import { LABEL_COLOR_HEX } from "@/lib/ui/colors";
import { Label, LabelColor } from "@/lib/labels/api";

export function FilterBar({
  labels,
  activeLabelIds,
  onToggleLabel,
  onClear,
  cardCount,
  sortByDueDate,
  onToggleSort,
}: {
  labels: Label[];
  activeLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onClear: () => void;
  cardCount: number;
  sortByDueDate: boolean;
  onToggleSort: () => void;
}) {
  const allActive = activeLabelIds.length === 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-3 sm:px-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Filtrar por etiqueta</span>
        <button
          type="button"
          onClick={onClear}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            allActive ? "bg-brand text-brand-foreground" : "bg-black/5 text-foreground hover:bg-black/10"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" /> Todas
        </button>
        {labels.map((label) => {
          const active = activeLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => onToggleLabel(label.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-black text-white" : "bg-black/5 text-foreground hover:bg-black/10"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LABEL_COLOR_HEX[label.color as LabelColor] }}
              />
              {label.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">
          {cardCount} card{cardCount === 1 ? "" : "s"} no quadro
        </span>
        <button
          type="button"
          onClick={onToggleSort}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            sortByDueDate
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-surface text-foreground hover:bg-black/5"
          }`}
        >
          ⇅ Ordenar por prazo
        </button>
      </div>
    </div>
  );
}
