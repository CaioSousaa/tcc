import { faceAccessibleName, faceLabel, sectionLabel, type ChecklistProgress as Progress } from "@/lib/checklist";

type Props = { progress: Progress; variant: "face" | "section"; labelId?: string };

/**
 * Progress bar of the checklist, on the card face or in the dialog section (spec 2.1, 2.6, N128, N129).
 * Only <span> elements: the face variant lives inside the card <button>.
 */
export function ChecklistProgress({ progress, variant, labelId }: Props) {
  const fill = progress.complete ? "bg-emerald-600" : "bg-brand";

  const bar = (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percent}
      aria-label={variant === "face" ? faceAccessibleName(progress) : undefined}
      aria-labelledby={variant === "section" ? labelId : undefined}
      className={`block w-full overflow-hidden rounded-full bg-line ${variant === "face" ? "h-1.5" : "h-2"}`}
    >
      <span className={`block h-full rounded-full transition-[width] ${fill}`} style={{ width: `${progress.percent}%` }} />
    </span>
  );

  if (variant === "section") {
    return (
      <span className="flex flex-col gap-2">
        <span id={labelId} className="sr-only">
          {sectionLabel(progress)}
        </span>
        {bar}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {bar}
      <span aria-hidden="true" className={`shrink-0 font-mono text-xs ${progress.complete ? "text-emerald-700" : "text-muted"}`}>
        {faceLabel(progress)}
      </span>
    </span>
  );
}
