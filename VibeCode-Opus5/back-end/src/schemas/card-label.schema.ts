import { z } from "zod";

export const createCardLabelSchema = z.object({
  cardId: z.uuid("Card não encontrado."),
  labelId: z.uuid("Etiqueta não encontrada."),
});

export const cardLabelIdSchema = z.uuid("Atribuição não encontrada.");

export type CreateCardLabelInput = z.infer<typeof createCardLabelSchema>;
