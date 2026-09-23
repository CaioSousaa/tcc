import { DUE_BADGE_COLORS, dueAccessibleName, dueStatus } from "@/lib/dueDate";

type Props = {
  /** YYYY-MM-DD or null. */
  dueDate: string | null;
  /** Device's today, read once per render by the caller (RF10 F145). */
  today: string;
  size?: "sm" | "md";
};

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.8v3.6M8 10.9v.1" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.8V8l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Due date status (RF10 spec 2.3): the text always states the status; overdue also
 * has an alert icon besides the red color (N211). Only <span> elements: the face
 * variant lives inside the card <button>.
 */
export function DueDateBadge({ dueDate, today, size = "sm" }: Props) {
  if (dueDate === null) return null;
  const status = dueStatus(dueDate, today);
  if (status.kind === "none") return null;
  const colors = DUE_BADGE_COLORS[status.kind];

  return (
    <span
      role="img"
      aria-label={dueAccessibleName(dueDate, status)}
      className={`inline-flex w-fit items-center gap-1 rounded-md font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"}`}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {status.kind === "overdue" ? <AlertIcon /> : <ClockIcon />}
      <span aria-hidden="true">{status.text}</span>
    </span>
  );
}
