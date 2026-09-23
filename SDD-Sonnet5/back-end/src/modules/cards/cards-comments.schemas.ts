import { z, ZodError } from "zod";

const textSchema = z
  .string({ required_error: "text is required" })
  .trim()
  .min(1, "text is required")
  .max(2000, "text must be at most 2000 characters long");

export const createCommentSchema = z.object({
  text: textSchema,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

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
