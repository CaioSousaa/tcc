import { labelColorOption } from "@/lib/labelColors";

type Props = { name: string; color: string; size?: "sm" | "md" };

/**
 * Label name over its color. The name is always visible text, so color is never
 * the only cue (RF08 N174); styles come only from the closed palette (N167).
 * Only <span> elements: the face variant lives inside the card <button>.
 */
export function LabelChip({ name, color, size = "sm" }: Props) {
  const option = labelColorOption(color);
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-md font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"}`}
      style={{ backgroundColor: option.background, color: option.text }}
    >
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Small colored dot used in rows and in the filter bar. */
export function LabelDot({ color }: { color: string }) {
  return <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: labelColorOption(color).swatch }} />;
}
