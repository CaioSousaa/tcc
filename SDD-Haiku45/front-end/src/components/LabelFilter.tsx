"use client";

import { useLabels } from "@/hooks/useLabels";

interface LabelFilterProps {
  boardId: string;
  selectedLabelIds: string[];
  onToggle: (labelId: string) => void;
  onClear: () => void;
}

export default function LabelFilter({
  boardId,
  selectedLabelIds,
  onToggle,
  onClear,
}: LabelFilterProps) {
  const { labels, loading } = useLabels(boardId);

  if (loading || labels.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 items-center overflow-x-auto pb-2">
      <button
        onClick={onClear}
        className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap border ${
          selectedLabelIds.length === 0
            ? "bg-gray-800 text-white border-gray-800"
            : "text-gray-700 border-gray-300 hover:bg-gray-100"
        }`}
      >
        Todas
      </button>
      {labels.map((label) => {
        const active = selectedLabelIds.includes(label.id);
        return (
          <button
            key={label.id}
            onClick={() => onToggle(label.id)}
            className="px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap border flex items-center gap-1"
            style={
              active
                ? { backgroundColor: label.color, borderColor: label.color, color: "#fff" }
                : { borderColor: label.color, color: "#374151" }
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: active ? "#fff" : label.color }}
            />
            {label.name}
          </button>
        );
      })}
    </div>
  );
}
