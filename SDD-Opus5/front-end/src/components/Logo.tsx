export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-lg bg-brand font-bold text-white ${
          compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"
        }`}
      >
        K
      </span>
      <span className={`font-semibold text-ink ${compact ? "text-lg" : "text-xl"}`}>Kanbo</span>
    </div>
  );
}
