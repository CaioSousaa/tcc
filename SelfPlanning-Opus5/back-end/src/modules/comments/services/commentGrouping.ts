import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { Comment } from "../entities/Comment";

export async function countCommentsByCards(
  cardIds: string[],
  manager: EntityManager = AppDataSource.manager
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(cardIds.map((cardId) => [cardId, 0]));

  if (cardIds.length === 0) {
    return counts;
  }

  const rows = await manager
    .getRepository(Comment)
    .createQueryBuilder("comment")
    .select("comment.card_id", "cardId")
    .addSelect("COUNT(comment.id)", "total")
    .where("comment.card_id IN (:...cardIds)", { cardIds })
    .groupBy("comment.card_id")
    .getRawMany<{ cardId: string; total: string }>();

  for (const row of rows) {
    counts.set(row.cardId, Number(row.total));
  }

  return counts;
}

export async function countCommentsOfCard(cardId: string): Promise<number> {
  return AppDataSource.getRepository(Comment).count({ where: { cardId } });
}
