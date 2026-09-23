const AVATAR_COLORS = ["#1e3a5f", "#2f6fb5", "#2e7d5b", "#d89b1c", "#8e5cd9"];

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";

  return `${first}${last}`.toUpperCase();
}

function colorOf(seed: string): string {
  const sum = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);

  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

interface AvatarProps {
  name: string | null;
  email: string;
  size?: "sm" | "md";
  muted?: boolean;
}

export function Avatar({ name, email, size = "md", muted = false }: AvatarProps) {
  const label = name ?? email;

  return (
    <span
      title={label}
      style={{ backgroundColor: muted ? "#94a3b8" : colorOf(email) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs"
      }`}
    >
      {initialsOf(label)}
    </span>
  );
}
