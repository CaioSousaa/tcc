import { z } from "zod";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Informe o título do card.")
  .max(200, "O título do card deve ter no máximo 200 caracteres.");

const descriptionSchema = z
  .string()
  .trim()
  .max(4000, "A descrição deve ter no máximo 4000 caracteres.")
  .nullable();

const positionSchema = z
  .number()
  .int("A posição deve ser um número inteiro.")
  .min(0, "A posição deve ser maior ou igual a zero.");

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .nullable();

export const createCardSchema = z.object({
  listId: z.uuid("Lista não encontrada."),
  title: titleSchema,
  description: descriptionSchema.optional(),
  position: positionSchema.optional(),
  dueDate: dueDateSchema.optional(),
});

export const updateCardSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    listId: z.uuid("Lista não encontrada.").optional(),
    position: positionSchema.optional(),
    dueDate: dueDateSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.listId !== undefined ||
      data.position !== undefined ||
      data.dueDate !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
      path: ["title"],
    },
  );

export const cardIdSchema = z.uuid("Card não encontrado.");

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
