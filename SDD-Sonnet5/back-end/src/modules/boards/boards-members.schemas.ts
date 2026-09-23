import { z, ZodError } from "zod";

const emailSchema = z
  .string({ required_error: "email is required" })
  .trim()
  .min(1, "email is required")
  .email("email must be a valid email address");

const roleSchema = z.enum(["administrador", "membro"], {
  required_error: "role is required",
  invalid_type_error: "role must be either 'administrador' or 'membro'",
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema,
});

export const updateMemberRoleSchema = z.object({
  role: roleSchema,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export function formatZodError(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in fields)) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
