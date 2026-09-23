import { z } from "zod";
import { LABEL_COLORS } from "../entities/Label";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome da etiqueta.")
  .max(60, "O nome da etiqueta deve ter no máximo 60 caracteres.");

const colorSchema = z.enum(LABEL_COLORS, {
  message: "Escolha uma das cores disponíveis.",
});

export const createLabelSchema = z.object({
  name: nameSchema,
  color: colorSchema.default("blue"),
});

export const updateLabelSchema = z
  .object({
    name: nameSchema.optional(),
    color: colorSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.color !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
    path: ["name"],
  });

export const labelIdSchema = z.uuid("Etiqueta não encontrada.");

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
