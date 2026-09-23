import { z, ZodError } from "zod";

const nameSchema = z
  .string({ required_error: "name is required" })
  .trim()
  .min(1, "name is required")
  .max(100, "name must be at most 100 characters long");

const descriptionSchema = z
  .string()
  .max(500, "description must be at most 500 characters long");

export const createBoardSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
});

export const updateBoardSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.nullable().optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

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
