import { LABEL_COLOR_HEX } from "@/lib/ui/colors";
import { LabelColor } from "@/lib/labels/api";

export function LabelBadge({
  name,
  color,
  onRemove,
  className,
}: {
  name: string;
  color: string;
  onRemove?: () => void;
  className?: string;
}) {
  const hex = LABEL_COLOR_HEX[color as LabelColor] ?? "#52525b";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white ${className ?? ""}`}
      style={{ backgroundColor: hex }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover etiqueta ${name}`}
          className="leading-none opacity-80 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
