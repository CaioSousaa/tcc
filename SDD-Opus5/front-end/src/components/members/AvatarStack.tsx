import { extraAvatarsLabel, visibleAvatars } from "@/lib/members";
import { Avatar } from "./Avatar";

type Person = { userId: string; name: string };

type Props = {
  people: readonly Person[];
  max: number;
  /** Total when `people` is only a preview (e.g. `memberCount` in "Meus quadros"). */
  total?: number;
  size?: "xs" | "sm" | "md";
};

/**
 * Overlapping avatars followed by "+K" when there are more people (RF07 C171, N151).
 * Only <span> elements: the card face variant lives inside the card <button>.
 */
export function AvatarStack({ people, max, total, size = "sm" }: Props) {
  const { shown, extra: extraShown } = visibleAvatars(people, max);
  const extra = total === undefined ? extraShown : Math.max(0, total - shown.length);
  if (shown.length === 0) return null;

  return (
    <span className="flex items-center">
      <span role="list" className="flex items-center -space-x-1.5">
        {shown.map((person) => (
          <span role="listitem" key={person.userId}>
            <Avatar name={person.name} colorKey={person.userId} size={size} ringed />
          </span>
        ))}
      </span>
      {extra > 0 ? (
        <span aria-label={extraAvatarsLabel(extra)} className="ml-1.5 text-xs font-medium text-muted">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
