"use client";

import { LABEL_COLOR_HEX, type Label } from "@/lib/labels";

interface LabelFilterBarProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggle: (labelId: string) => void;
  onClear: () => void;
}

export function LabelFilterBar({
  labels,
  selectedLabelIds,
  onToggle,
  onClear,
}: LabelFilterBarProps) {
  if (labels.length === 0) {
    return null;
  }

  const isAllActive = selectedLabelIds.length === 0;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">Filtrar por etiqueta</span>

      <button
        type="button"
        onClick={onClear}
        className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
          isAllActive
            ? "border-navy bg-navy text-white"
            : "border-line text-foreground hover:bg-surface"
        }`}
      >
        Todas
      </button>

      {labels.map((label) => {
        const isActive = selectedLabelIds.includes(label.id);

        return (
          <button
            key={label.id}
            type="button"
            onClick={() => onToggle(label.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition ${
              isActive
                ? "border-navy text-foreground"
                : "border-line text-muted hover:bg-surface"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
            />
            {label.name}
          </button>
        );
      })}
    </div>
  );
}
