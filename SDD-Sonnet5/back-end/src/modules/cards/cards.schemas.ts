import { z, ZodError } from "zod";

const titleSchema = z
  .string({ required_error: "title is required" })
  .trim()
  .min(1, "title is required")
  .max(200, "title must be at most 200 characters long");

const descriptionSchema = z
  .string()
  .max(2000, "description must be at most 2000 characters long");

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be in AAAA-MM-DD format")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    if (year === undefined || month === undefined || day === undefined) {
      return false;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "dueDate must be a valid calendar date");

export const createCardSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  dueDate: dueDateSchema.optional(),
});

export const updateCardSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.nullable().optional(),
  targetListId: z.string().min(1, "targetListId cannot be empty").optional(),
  dueDate: dueDateSchema.nullable().optional(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

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
