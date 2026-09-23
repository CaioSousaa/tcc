import { colorForId, initials } from "@/lib/ui/colors";

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
} as const;

export function Avatar({
  id,
  name,
  size = "md",
  className,
}: {
  id: string;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white ${SIZES[size]} ${className ?? ""}`}
      style={{ backgroundColor: colorForId(id) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  size = "md",
}: {
  people: { id: string; name: string }[];
  size?: keyof typeof SIZES;
}) {
  return (
    <div className="flex items-center -space-x-2">
      {people.map((person) => (
        <Avatar key={person.id} id={person.id} name={person.name} size={size} />
      ))}
    </div>
  );
}
