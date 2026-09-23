import { z } from "zod";

export const createCardAssigneeSchema = z.object({
  cardId: z.uuid("Card não encontrado."),
  userId: z.uuid("Membro não encontrado."),
});

export const cardAssigneeIdSchema = z.uuid("Atribuição não encontrada.");

export type CreateCardAssigneeInput = z.infer<typeof createCardAssigneeSchema>;
