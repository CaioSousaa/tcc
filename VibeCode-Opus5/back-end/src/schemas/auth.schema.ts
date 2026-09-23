import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email("Informe um e-mail válido.")
      .max(180, "O e-mail deve ter no máximo 180 caracteres."),
  );

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe seu nome completo.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    email: emailSchema,
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .max(72, "A senha deve ter no máximo 72 caracteres."),
    confirmPassword: z.string(),
    rememberMe: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
  rememberMe: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
