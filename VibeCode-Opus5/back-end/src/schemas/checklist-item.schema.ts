import { z } from "zod";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Informe o texto do item.")
  .max(200, "O item deve ter no máximo 200 caracteres.");

const positionSchema = z
  .number()
  .int("A posição deve ser um número inteiro.")
  .min(0, "A posição deve ser maior ou igual a zero.");

export const createChecklistItemSchema = z.object({
  cardId: z.uuid("Card não encontrado."),
  title: titleSchema,
  position: positionSchema.optional(),
});

export const updateChecklistItemSchema = z
  .object({
    title: titleSchema.optional(),
    done: z.boolean().optional(),
    position: positionSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.done !== undefined ||
      data.position !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
      path: ["title"],
    },
  );

export const checklistItemIdSchema = z.uuid("Item não encontrado.");

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
