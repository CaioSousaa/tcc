import { Repository } from "typeorm";
import { Card } from "../entities/Card";
import { AppDataSource } from "../database";

export class CardRepository {
  private repo: Repository<Card>;

  constructor() {
    this.repo = AppDataSource.getRepository(Card);
  }

  async insert(card: Partial<Card>): Promise<Card> {
    const newCard = this.repo.create(card);
    return this.repo.save(newCard);
  }

  async findById(cardId: string, listId: string): Promise<Card | null> {
    return this.repo.findOne({
      where: { id: cardId, list_id: listId },
    });
  }

  async findByCardId(cardId: string): Promise<Card | null> {
    return this.repo.findOne({
      where: { id: cardId },
      relations: { list: true },
    });
  }

  async findByList(listId: string): Promise<Card[]> {
    return this.repo.find({
      where: { list_id: listId },
      order: { position: "ASC" },
    });
  }

  async countByList(listId: string): Promise<number> {
    return this.repo.count({
      where: { list_id: listId },
    });
  }

  async countByBoard(boardId: string): Promise<number> {
    return this.repo
      .createQueryBuilder("card")
      .innerJoin("card.list", "list")
      .where("list.board_id = :boardId", { boardId })
      .getCount();
  }

  async countGroupedByList(boardId: string): Promise<Record<string, number>> {
    const rows = await this.repo
      .createQueryBuilder("card")
      .innerJoin("card.list", "list")
      .select("card.list_id", "list_id")
      .addSelect("COUNT(*)", "count")
      .where("list.board_id = :boardId", { boardId })
      .groupBy("card.list_id")
      .getRawMany<{ list_id: string; count: string }>();

    return Object.fromEntries(rows.map((r) => [r.list_id, Number(r.count)]));
  }

  async update(
    cardId: string,
    listId: string,
    data: Partial<Card>
  ): Promise<void> {
    await this.repo.update(
      { id: cardId, list_id: listId },
      {
        ...data,
        updated_at: new Date(),
      }
    );
  }

  async delete(cardId: string, listId: string): Promise<void> {
    await this.repo.delete({
      id: cardId,
      list_id: listId,
    });
  }

  async updatePositions(
    listId: string,
    cardsData: Array<{ id: string; position: number }>
  ): Promise<void> {
    for (const { id, position } of cardsData) {
      await this.repo.update(
        { id, list_id: listId },
        {
          position,
          updated_at: new Date(),
        }
      );
    }
  }

  async moveCard(
    cardId: string,
    fromListId: string,
    toListId: string,
    position: number
  ): Promise<void> {
    await this.repo.update(
      { id: cardId, list_id: fromListId },
      {
        list_id: toListId,
        position,
        updated_at: new Date(),
      }
    );
  }

  async findOverdueCards(boardId: string): Promise<Card[]> {
    return this.repo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.list", "list")
      .where("list.board_id = :boardId", { boardId })
      .andWhere("card.due_date < CURRENT_DATE")
      .andWhere("card.due_date IS NOT NULL")
      .orderBy("card.due_date", "ASC")
      .getMany();
  }

  async findDueSoonCards(boardId: string, days: number): Promise<Card[]> {
    return this.repo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.list", "list")
      .where("list.board_id = :boardId", { boardId })
      .andWhere("card.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * :days", { days })
      .andWhere("card.due_date IS NOT NULL")
      .orderBy("card.due_date", "ASC")
      .getMany();
  }

  async findByDueFilter(boardId: string, filter: "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due"): Promise<Card[]> {
    let query = this.repo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.list", "list")
      .where("list.board_id = :boardId", { boardId });

    switch (filter) {
      case "overdue":
        query = query
          .andWhere("card.due_date < CURRENT_DATE")
          .andWhere("card.due_date IS NOT NULL");
        break;
      case "due_today":
        query = query.andWhere("card.due_date = CURRENT_DATE");
        break;
      case "next_7_days":
        query = query
          .andWhere("card.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'")
          .andWhere("card.due_date IS NOT NULL");
        break;
      case "next_30_days":
        query = query
          .andWhere("card.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'")
          .andWhere("card.due_date IS NOT NULL");
        break;
      case "no_due":
        query = query.andWhere("card.due_date IS NULL");
        break;
    }

    return query.orderBy("card.due_date", "ASC", "NULLS LAST").getMany();
  }

  async countByDueStatus(boardId: string): Promise<{
    overdue: number;
    due_today: number;
    next_7_days: number;
    next_30_days: number;
    no_due: number;
  }> {
    const [overdue, due_today, next_7_days, next_30_days, no_due] = await Promise.all([
      this.repo
        .createQueryBuilder("card")
        .leftJoin("card.list", "list")
        .where("list.board_id = :boardId", { boardId })
        .andWhere("card.due_date < CURRENT_DATE")
        .andWhere("card.due_date IS NOT NULL")
        .getCount(),
      this.repo
        .createQueryBuilder("card")
        .leftJoin("card.list", "list")
        .where("list.board_id = :boardId", { boardId })
        .andWhere("card.due_date = CURRENT_DATE")
        .getCount(),
      this.repo
        .createQueryBuilder("card")
        .leftJoin("card.list", "list")
        .where("list.board_id = :boardId", { boardId })
        .andWhere("card.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'")
        .andWhere("card.due_date IS NOT NULL")
        .getCount(),
      this.repo
        .createQueryBuilder("card")
        .leftJoin("card.list", "list")
        .where("list.board_id = :boardId", { boardId })
        .andWhere("card.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'")
        .andWhere("card.due_date IS NOT NULL")
        .getCount(),
      this.repo
        .createQueryBuilder("card")
        .leftJoin("card.list", "list")
        .where("list.board_id = :boardId", { boardId })
        .andWhere("card.due_date IS NULL")
        .getCount(),
    ]);

    return { overdue, due_today, next_7_days, next_30_days, no_due };
  }

  async updateDueDate(cardId: string, listId: string, dueDate: Date): Promise<void> {
    await this.repo.update(
      { id: cardId, list_id: listId },
      {
        due_date: dueDate,
        updated_at: new Date(),
      }
    );
  }

  async removeDueDate(cardId: string, listId: string): Promise<void> {
    await this.repo.update(
      { id: cardId, list_id: listId },
      {
        due_date: null,
        updated_at: new Date(),
      }
    );
  }
}
