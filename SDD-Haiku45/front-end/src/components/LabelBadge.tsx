"use client";

interface LabelBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  readonly?: boolean;
}

export default function LabelBadge({
  name,
  color,
  onRemove,
  readonly = false,
}: LabelBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: color }}
      title={name}
    >
      <span>{name}</span>
      {!readonly && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-80 font-bold"
          title="Remover"
        >
          ✕
        </button>
      )}
    </div>
  );
}
