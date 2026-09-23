import { z, ZodError } from "zod";

export const associateLabelSchema = z.object({
  labelId: z.string({ required_error: "labelId is required" }).trim().min(1, "labelId is required"),
});

export type AssociateLabelInput = z.infer<typeof associateLabelSchema>;

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
