import { z, ZodError } from "zod";

export const assignMemberSchema = z.object({
  userId: z.string({ required_error: "userId is required" }).trim().min(1, "userId is required"),
});

export type AssignMemberInput = z.infer<typeof assignMemberSchema>;

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
