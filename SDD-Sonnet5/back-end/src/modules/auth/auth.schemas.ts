import { z, ZodError } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(1, "name is required"),
  email: z
    .string({ required_error: "email is required" })
    .trim()
    .min(1, "email is required")
    .email("email must be a valid email address"),
  password: z
    .string({ required_error: "password is required" })
    .min(8, "password must be at least 8 characters long"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .trim()
    .min(1, "email is required"),
  password: z.string({ required_error: "password is required" }).min(1, "password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

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
