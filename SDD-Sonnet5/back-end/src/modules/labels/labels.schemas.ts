import { z, ZodError } from "zod";
import { LABEL_COLORS } from "./entities/label.entity";

const nameSchema = z
  .string({ required_error: "name is required" })
  .trim()
  .min(1, "name is required")
  .max(50, "name must be at most 50 characters long");

const colorSchema = z.enum(LABEL_COLORS, {
  required_error: "color is required",
  invalid_type_error: `color must be one of: ${LABEL_COLORS.join(", ")}`,
});

export const createLabelSchema = z.object({
  name: nameSchema,
  color: colorSchema,
});

export const updateLabelSchema = z
  .object({
    name: nameSchema.optional(),
    color: colorSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.color !== undefined, {
    message: "at least one of name or color must be provided",
  });

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

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
