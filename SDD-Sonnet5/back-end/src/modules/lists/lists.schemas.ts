import { z, ZodError } from "zod";

const nameSchema = z
  .string({ required_error: "name is required" })
  .trim()
  .min(1, "name is required")
  .max(100, "name must be at most 100 characters long");

export const createListSchema = z.object({
  name: nameSchema,
});

export const updateListSchema = z.object({
  name: nameSchema.optional(),
  position: z
    .number({ invalid_type_error: "position must be a number" })
    .int("position must be an integer")
    .min(0, "position must be zero or greater")
    .optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;

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
