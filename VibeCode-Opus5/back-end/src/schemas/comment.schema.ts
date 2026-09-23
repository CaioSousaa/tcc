import { z } from "zod";

export const createCommentSchema = z.object({
  cardId: z.uuid("Card não encontrado."),
  body: z
    .string()
    .trim()
    .min(1, "Escreva um comentário.")
    .max(2000, "O comentário deve ter no máximo 2000 caracteres."),
});

export const commentIdSchema = z.uuid("Comentário não encontrado.");

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
