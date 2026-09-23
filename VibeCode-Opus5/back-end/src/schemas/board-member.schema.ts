import { z } from "zod";
import { BOARD_MEMBER_ROLES } from "../entities/BoardMember";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email("Informe um e-mail válido.")
      .max(180, "O e-mail deve ter no máximo 180 caracteres."),
  );

const roleSchema = z.enum(BOARD_MEMBER_ROLES, {
  message: "Escolha um papel válido.",
});

export const inviteBoardMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema.default("member"),
});

export const updateBoardMemberRoleSchema = z.object({
  role: roleSchema,
});

export const boardMemberIdSchema = z.uuid("Membro não encontrado.");

export type InviteBoardMemberInput = z.infer<typeof inviteBoardMemberSchema>;
export type UpdateBoardMemberRoleInput = z.infer<
  typeof updateBoardMemberRoleSchema
>;
