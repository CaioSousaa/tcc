import { Repository } from "typeorm";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { Board } from "../entities/Board";

export class CardService {
  constructor(
    private cardRepository: Repository<Card>,
    private listRepository: Repository<List>,
    private boardRepository: Repository<Board>
  ) {}

  async createCard(listId: string, userId: string, title: string, description?: string): Promise<Card> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: { board: true },
    });

    if (!list || list.board.userId !== userId) {
      throw new Error("List not found");
    }

    if (!title.trim()) {
      throw new Error("Card title is required");
    }

    const cards = await this.cardRepository.find({ where: { listId }, order: { position: "DESC" } });
    const nextPosition = cards.length > 0 && cards[0] ? cards[0].position + 1 : 0;

    const cardData: any = {
      title,
      listId,
      position: nextPosition,
    };

    if (description !== undefined) {
      cardData.description = description;
    }

    const card = this.cardRepository.create(cardData);
    return this.cardRepository.save(card) as unknown as Promise<Card>;
  }

  async getCardsByList(listId: string, userId: string): Promise<Card[]> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: { board: true },
    });

    if (!list || list.board.userId !== userId) {
      throw new Error("List not found");
    }

    return this.cardRepository.find({
      where: { listId },
      order: { position: "ASC" },
    });
  }

  async getCardById(cardId: string, userId: string): Promise<Card | null> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true } },
    });

    if (!card || card.list.board.userId !== userId) {
      return null;
    }

    return card;
  }

  async updateCard(cardId: string, userId: string, data: { title?: string; description?: string; dueDate?: string | null }): Promise<Card> {
    const card = await this.getCardById(cardId, userId);
    if (!card) {
      throw new Error("Card not found");
    }

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        throw new Error("Card title is required");
      }
      card.title = data.title;
    }

    if (data.description !== undefined) {
      card.description = data.description;
    }

    if (data.dueDate !== undefined) {
      card.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return this.cardRepository.save(card);
  }

  async moveCard(cardId: string, userId: string, newListId: string, newPosition: number): Promise<Card> {
    const card = await this.getCardById(cardId, userId);
    if (!card) {
      throw new Error("Card not found");
    }

    const newList = await this.listRepository.findOne({
      where: { id: newListId },
      relations: { board: true },
    });

    if (!newList || newList.board.userId !== userId) {
      throw new Error("Target list not found");
    }

    const oldListId = card.listId;
    const oldPosition = card.position;

    if (oldListId === newListId) {
      const allCards = await this.cardRepository.find({
        where: { listId: oldListId },
        order: { position: "ASC" },
      });

      if (newPosition >= allCards.length) {
        throw new Error("Invalid position");
      }

      if (oldPosition < newPosition) {
        for (const c of allCards) {
          if (c.position > oldPosition && c.position <= newPosition) {
            c.position -= 1;
            await this.cardRepository.save(c);
          }
        }
      } else if (oldPosition > newPosition) {
        for (const c of allCards) {
          if (c.position >= newPosition && c.position < oldPosition) {
            c.position += 1;
            await this.cardRepository.save(c);
          }
        }
      }

      card.position = newPosition;
    } else {
      const oldListCards = await this.cardRepository.find({
        where: { listId: oldListId },
        order: { position: "ASC" },
      });

      for (const c of oldListCards) {
        if (c.position > oldPosition) {
          c.position -= 1;
          await this.cardRepository.save(c);
        }
      }

      const newListCards = await this.cardRepository.find({
        where: { listId: newListId },
        order: { position: "ASC" },
      });

      for (const c of newListCards) {
        if (c.position >= newPosition) {
          c.position += 1;
          await this.cardRepository.save(c);
        }
      }

      card.listId = newListId;
      card.position = newPosition;
    }

    return this.cardRepository.save(card);
  }

  async deleteCard(cardId: string, userId: string): Promise<void> {
    const card = await this.getCardById(cardId, userId);
    if (!card) {
      throw new Error("Card not found");
    }

    const allCards = await this.cardRepository.find({
      where: { listId: card.listId },
      order: { position: "ASC" },
    });

    for (const c of allCards) {
      if (c.position > card.position) {
        c.position -= 1;
        await this.cardRepository.save(c);
      }
    }

    await this.cardRepository.remove(card);
  }
}
