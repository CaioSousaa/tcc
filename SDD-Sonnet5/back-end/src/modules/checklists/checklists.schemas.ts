import { z, ZodError } from "zod";

export const createChecklistSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(1, "name is required")
    .max(100, "name must be at most 100 characters long"),
});

export const createItemSchema = z.object({
  text: z
    .string({ required_error: "text is required" })
    .trim()
    .min(1, "text is required")
    .max(500, "text must be at most 500 characters long"),
});

export const updateItemSchema = z.object({
  completed: z.boolean({ required_error: "completed is required" }),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

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
