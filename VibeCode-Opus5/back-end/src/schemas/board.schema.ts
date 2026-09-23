import { z } from "zod";
import { BOARD_COLORS } from "../entities/Board";

const titleSchema = z
  .string()
  .trim()
  .min(2, "O nome do quadro deve ter no mínimo 2 caracteres.")
  .max(120, "O nome do quadro deve ter no máximo 120 caracteres.");

const colorSchema = z.enum(BOARD_COLORS, {
  message: "Escolha uma das cores disponíveis.",
});

export const createBoardSchema = z.object({
  title: titleSchema,
  color: colorSchema.default("navy"),
});

export const updateBoardSchema = z
  .object({
    title: titleSchema.optional(),
    color: colorSchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.color !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
    path: ["title"],
  });

export const boardIdSchema = z.uuid("Quadro não encontrado.");

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
