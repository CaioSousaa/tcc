import { AppError } from "../../shared/errors/AppError";
import { MEMBER_ROLES, MemberRole, isMemberRole } from "./memberRoles";

export function requireMemberRole(value: unknown): MemberRole {
  if (!isMemberRole(value)) {
    throw new AppError(`O papel deve ser um destes: ${MEMBER_ROLES.join(", ")}`);
  }

  return value;
}
