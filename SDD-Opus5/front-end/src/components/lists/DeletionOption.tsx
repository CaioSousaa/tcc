import type { ReactNode } from "react";

type Props = {
  name: string;
  value: string;
  title: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  /** Shows the option as the rule in force, also by text (RF05 N104). */
  active?: boolean;
  destructive?: boolean;
  onSelect: () => void;
  children?: ReactNode;
};

/** One rule of the decision dialog: native radio, title, hint and optional content (N102). */
export function DeletionOption({ name, value, title, hint, checked, disabled, active = false, destructive = false, onSelect, children }: Props) {
  const tone = active
    ? "border-brand bg-brand/5"
    : checked
      ? destructive
        ? "border-danger/60 bg-danger/5"
        : "border-brand/60 bg-white"
      : "border-line bg-white";

  return (
    <div className={`rounded-xl border p-4 transition ${tone} ${disabled && !active ? "opacity-60" : ""}`}>
      <label className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked || active}
          disabled={disabled}
          onChange={onSelect}
          className="mt-1 h-4 w-4 accent-brand"
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[15px] font-medium text-ink">
            {title}
            {active ? <span className="ml-2 text-xs font-semibold uppercase text-brand">(em vigor)</span> : null}
          </span>
          <span className="text-sm text-muted">{hint}</span>
        </span>
      </label>
      {children ? <div className="mt-3 pl-7">{children}</div> : null}
    </div>
  );
}
