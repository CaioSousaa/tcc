import { LabelChip } from "@/components/labels/LabelChip";
import { resolveLabels } from "@/lib/labels";
import { MESSAGES } from "@/lib/messages";
import type { LabelView } from "@/services/labelService";

type Props = {
  labelIds: readonly string[];
  labels: readonly LabelView[];
  onManage: () => void;
};

/** "Etiquetas" in the card dialog: applied labels and "Gerenciar etiquetas" (RF08 spec 2.6). */
export function CardLabelsSection({ labelIds, labels, onManage }: Props) {
  const applied = resolveLabels(labelIds, labels);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-ink">{MESSAGES.cardLabelsTitle}</h3>
      {applied.length === 0 ? (
        <p className="text-sm text-muted">{MESSAGES.cardLabelsEmpty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {applied.map((label) => (
            <li key={label.id} className="max-w-full">
              <LabelChip name={label.name} color={label.color} size="md" />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onManage}
        className="h-9 w-fit rounded-lg border border-line bg-white px-3 text-sm text-ink transition hover:bg-surface"
      >
        {MESSAGES.manageLabels}
      </button>
    </section>
  );
}
