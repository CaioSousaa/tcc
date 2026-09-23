import { z } from "zod";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome da lista.")
  .max(120, "O nome da lista deve ter no máximo 120 caracteres.");

const positionSchema = z
  .number()
  .int("A posição deve ser um número inteiro.")
  .min(0, "A posição deve ser maior ou igual a zero.");

export const createListSchema = z.object({
  title: titleSchema,
  position: positionSchema.optional(),
});

export const updateListSchema = z
  .object({
    title: titleSchema.optional(),
    position: positionSchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.position !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
    path: ["title"],
  });

export const reorderListsSchema = z.object({
  listIds: z
    .array(z.uuid("Lista não encontrada."))
    .min(1, "Informe a nova ordem das listas."),
});

export const listIdSchema = z.uuid("Lista não encontrada.");

/** What to do with a list's cards when the list itself is deleted. */
export const deleteListSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("delete") }),
  z.object({
    mode: z.literal("move"),
    targetListId: z.uuid("Lista não encontrada."),
  }),
]);

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
export type DeleteListInput = z.infer<typeof deleteListSchema>;
