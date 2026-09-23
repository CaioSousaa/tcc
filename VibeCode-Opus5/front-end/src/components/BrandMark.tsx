export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8 text-sm" : "h-9 w-9 text-base";
  const label = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`${box} grid place-items-center rounded-lg bg-navy font-bold text-white`}
      >
        K
      </span>
      <span className={`${label} font-bold tracking-tight text-foreground`}>
        Kanbo
      </span>
    </div>
  );
}
