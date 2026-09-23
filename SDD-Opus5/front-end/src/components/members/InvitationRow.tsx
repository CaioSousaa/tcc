import { TrashIcon } from "@/components/boards/icons";
import { emailInitial, roleLabel } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import type { BoardRole } from "@/lib/permissions";
import type { InvitationView } from "@/services/memberService";
import { Avatar } from "./Avatar";
import { RoleSelect } from "./RoleSelect";

type Props = {
  invitation: InvitationView;
  canManage: boolean;
  pending: boolean;
  onRoleChange: (invitation: InvitationView, role: BoardRole) => void;
  onCancel: (invitation: InvitationView) => void;
};

/** Pending invitation: e-mail initial, e-mail, "convite pendente", role and cancel (RF07 spec 2.3). */
export function InvitationRow({ invitation, canManage, pending, onRoleChange, onCancel }: Props) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-t-0">
      <Avatar name={invitation.email} label={emailInitial(invitation.email)} size="md" decorative />
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-medium text-ink [overflow-wrap:anywhere]">{invitation.email}</p>
      </div>
      <span className="text-sm text-muted">{MESSAGES.statusPending}</span>
      {canManage ? (
        <>
          <RoleSelect
            value={invitation.role}
            label={`Papel do convite de ${invitation.email}`}
            disabled={pending}
            onChange={(role) => onRoleChange(invitation, role)}
            className="w-40"
          />
          <button
            type="button"
            aria-label={`Cancelar convite de ${invitation.email}`}
            onClick={() => onCancel(invitation)}
            disabled={pending}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-danger transition hover:bg-danger/5 disabled:opacity-60"
          >
            <TrashIcon />
          </button>
        </>
      ) : (
        <span className="w-28 text-sm text-ink">{roleLabel(invitation.role)}</span>
      )}
    </li>
  );
}
