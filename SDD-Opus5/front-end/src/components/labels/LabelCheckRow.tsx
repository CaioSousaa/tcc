import { useId } from "react";
import type { LabelView } from "@/services/labelService";
import { LabelDot } from "./LabelChip";

type Props = {
  label: LabelView;
  checked: boolean;
  pending: boolean;
  onChange: (label: LabelView, apply: boolean) => void;
};

/** Row of the card mode: checkbox named by the label, color, name and usage (RF08 spec 2.3, N178). */
export function LabelCheckRow({ label, checked, pending, onChange }: Props) {
  const inputId = useId();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(event) => onChange(label, event.target.checked)}
        className="h-4 w-4 shrink-0 accent-brand"
      />
      <LabelDot color={label.color} />
      <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer break-words text-[15px] text-ink [overflow-wrap:anywhere]">
        {label.name}
      </label>
      <span className="font-mono text-xs text-muted" aria-label={`${label.usage} cards`}>
        {label.usage}
      </span>
    </li>
  );
}
