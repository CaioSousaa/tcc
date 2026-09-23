import { LABEL_COLOR_HEX, LabelColor } from "@/lib/labelColors";

interface LabelChipProps {
  name: string;
  color: LabelColor;
}

export function LabelChip({ name, color }: LabelChipProps) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${LABEL_COLOR_HEX[color]}1f`, color: LABEL_COLOR_HEX[color] }}
    >
      {name}
    </span>
  );
}
