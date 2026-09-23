import { getAvatarColor } from "@/lib/avatar-colors";
import { getInitials } from "@/lib/initials";

interface AvatarProps {
  seed: string;
  name: string | null;
  size?: "sm" | "md";
  title?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-xs",
};

export function Avatar({ seed, name, size = "sm", title }: AvatarProps) {
  return (
    <span
      title={title ?? name ?? undefined}
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: getAvatarColor(seed) }}
    >
      {getInitials(name ?? "?")}
    </span>
  );
}
