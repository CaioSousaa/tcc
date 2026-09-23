"use client";

interface ChecklistProgressProps {
  completed: number;
  total: number;
  percentage: number;
}

export function ChecklistProgress({ completed, total, percentage }: ChecklistProgressProps) {
  if (total === 0) return null;

  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
