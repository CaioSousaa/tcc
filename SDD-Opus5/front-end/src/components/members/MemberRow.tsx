import { TrashIcon } from "@/components/boards/icons";
import { memberStatus, roleLabel } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import type { BoardRole } from "@/lib/permissions";
import type { MemberView } from "@/services/memberService";
import { Avatar } from "./Avatar";
import { RoleSelect } from "./RoleSelect";

type Props = {
  member: MemberView;
  currentUserId: string | undefined;
  /** Role selector and remove action (RF07 spec 2.3 table). */
  canManage: boolean;
  pending: boolean;
  onRoleChange: (member: MemberView, role: BoardRole) => void;
  onRemove: (member: MemberView) => void;
  onLeave: () => void;
};

/** Avatar, name, e-mail, state, role and actions of a participant (N155). */
export function MemberRow({ member, currentUserId, canManage, pending, onRoleChange, onRemove, onLeave }: Props) {
  const isMe = member.userId === currentUserId;

  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-t-0">
      <Avatar name={member.name} colorKey={member.userId} size="md" decorative />
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-medium text-ink [overflow-wrap:anywhere]">{member.name}</p>
        <p className="break-words text-sm text-muted [overflow-wrap:anywhere]">{member.email}</p>
      </div>
      <span className="text-sm text-muted">{memberStatus(member, currentUserId)}</span>
      {canManage ? (
        <RoleSelect
          value={member.role}
          label={`Papel de ${member.name}`}
          disabled={pending}
          onChange={(role) => onRoleChange(member, role)}
          className="w-40"
        />
      ) : (
        <span className="w-28 text-sm text-ink">{roleLabel(member.role)}</span>
      )}
      {isMe ? (
        <button
          type="button"
          onClick={onLeave}
          disabled={pending}
          className="h-9 rounded-lg border border-danger/40 bg-white px-3 text-sm font-medium text-danger transition hover:bg-danger/5 disabled:opacity-60"
        >
          {MESSAGES.leaveBoard}
        </button>
      ) : canManage ? (
        <button
          type="button"
          aria-label={`Remover ${member.name}`}
          onClick={() => onRemove(member)}
          disabled={pending}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-danger transition hover:bg-danger/5 disabled:opacity-60"
        >
          <TrashIcon />
        </button>
      ) : null}
    </li>
  );
}
