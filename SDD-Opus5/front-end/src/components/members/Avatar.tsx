import { initials } from "@/lib/initials";
import { avatarColor } from "@/lib/members";

type Props = {
  /** Full name, used for the initials and the accessible name (RF07 N151). */
  name: string;
  /** Key for the color; the user id when known. */
  colorKey?: string;
  /** Overrides the initials, e.g. the first letter of an invitation e-mail. */
  label?: string;
  size?: "xs" | "sm" | "md";
  /** Decorative avatars inside a labelled control are hidden from assistive technology. */
  decorative?: boolean;
  ringed?: boolean;
};

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-sm",
} as const;

/** Circle with the initials of an account (RF07 spec "Avatar"). */
export function Avatar({ name, colorKey, label, size = "sm", decorative = false, ringed = false }: Props) {
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      title={decorative ? undefined : name}
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${SIZES[size]} ${
        ringed ? "ring-2 ring-white" : ""
      }`}
      style={{ backgroundColor: avatarColor(colorKey ?? name) }}
    >
      {label ?? initials(name)}
    </span>
  );
}
