interface ChecklistProgressBarProps {
  done: number;
  total: number;
}

export function ChecklistProgressBar({
  done,
  total,
}: ChecklistProgressBarProps) {
  if (total === 0) {
    return null;
  }

  const percent = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-navy transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-muted">
        {done}/{total}
      </span>
    </div>
  );
}
