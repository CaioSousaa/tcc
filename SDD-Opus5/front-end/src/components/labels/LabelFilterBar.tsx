import { visibleTotalLabel, type LabelSelection } from "@/lib/labels";
import { MESSAGES } from "@/lib/messages";
import type { LabelView } from "@/services/labelService";
import { LabelDot } from "./LabelChip";

type Props = {
  labels: readonly LabelView[];
  selection: LabelSelection;
  onToggle: (labelId: string) => void;
  onClear: () => void;
  visible: number;
  total: number;
  /** "Ordenar por prazo": display-only toggle (RF10 spec 2.5). */
  sortByDue: boolean;
  onToggleSortByDue: () => void;
};

const optionClass = (pressed: boolean) =>
  `flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
    pressed ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-surface"
  }`;

/**
 * "Filtrar por etiqueta" bar (RF08 spec 2.7, 2.8). Toggle buttons with
 * `aria-pressed` and a polite live total (N177). Filtering never reaches the API (F102).
 */
export function LabelFilterBar({ labels, selection, onToggle, onClear, visible, total, sortByDue, onToggleSortByDue }: Props) {
  const filtered = selection.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white/60 px-6 py-3 lg:px-8">
      <div role="group" aria-label={MESSAGES.filterByLabel} className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">{MESSAGES.filterByLabel}</span>
        <button type="button" aria-pressed={!filtered} onClick={onClear} className={optionClass(!filtered)}>
          {MESSAGES.filterAll}
        </button>
        {labels.map((label) => {
          const pressed = selection.has(label.id);
          return (
            <button key={label.id} type="button" aria-pressed={pressed} onClick={() => onToggle(label.id)} className={optionClass(pressed)}>
              <LabelDot color={label.color} />
              <span className="max-w-[16rem] truncate">{label.name}</span>
            </button>
          );
        })}
      </div>
      {/* aria-pressed and a check mark mark the active state beyond color (RF10 N213). */}
      <button type="button" aria-pressed={sortByDue} onClick={onToggleSortByDue} className={`ml-auto ${optionClass(sortByDue)}`}>
        {sortByDue ? <span aria-hidden="true">✓</span> : null}
        {MESSAGES.sortByDueDate}
      </button>
      <p aria-live="polite" className="text-sm text-muted">
        {visibleTotalLabel(visible, total, filtered)}
      </p>
    </div>
  );
}
