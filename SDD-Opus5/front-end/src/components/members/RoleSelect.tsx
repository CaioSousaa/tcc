import { MESSAGES } from "@/lib/messages";
import type { BoardRole } from "@/lib/permissions";

type Props = {
  value: BoardRole;
  /** Accessible name, e.g. "Papel de Caio Rocha" (RF07 N152). */
  label: string;
  onChange: (role: BoardRole) => void;
  disabled?: boolean;
  className?: string;
};

/** Native selector with the two roles of RF07 RN03. */
export function RoleSelect({ value, label, onChange, disabled = false, className = "" }: Props) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === "admin" ? "admin" : "member")}
      className={`h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 ${className}`}
    >
      <option value="admin">{MESSAGES.roleAdmin}</option>
      <option value="member">{MESSAGES.roleMember}</option>
    </select>
  );
}
