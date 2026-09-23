import { LABEL_COLOR_HEX, type LabelColor } from "@/lib/labels";

interface LabelChipProps {
  name: string;
  color: LabelColor;
}

export function LabelChip({ name, color }: LabelChipProps) {
  const hex = LABEL_COLOR_HEX[color];

  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${hex}22`, color: hex }}
    >
      {name}
    </span>
  );
}
