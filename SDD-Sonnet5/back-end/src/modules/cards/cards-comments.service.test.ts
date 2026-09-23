import crypto from "node:crypto";
import { CardsCommentsService } from "./cards-comments.service";
import { CardNotFoundError } from "./cards.errors";
import { ListNotFoundError } from "../lists/lists.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { Card } from "./entities/card.entity";
import { CardRepository } from "./repositories/repository.types";
import {
  CommentRepository,
  CommentWithAuthor,
  CreateCommentData,
} from "./repositories/comment.repository.types";
import { List } from "../lists/entities/list.entity";
import { ListRepository } from "../lists/repositories/repository.types";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";

class FakeCardRepository implements CardRepository {
  private readonly cards = new Map<string, { id: string; listId: string }>();

  registerCard(id: string, listId: string) {
    this.cards.set(id, { id, listId });
  }

  async findByIdAndList(id: string, listId: string): Promise<Card | null> {
    const card = this.cards.get(id);
    if (!card || card.listId !== listId) return null;
    return card as unknown as Card;
  }

  async create(): Promise<Card> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async findAllByList(): Promise<Card[]> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async update(): Promise<Card | null> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async move(): Promise<Card | null> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async deleteAllByList(): Promise<number> {
    throw new Error("not used by CardsCommentsService tests");
  }
}

class FakeListRepository implements ListRepository {
  private readonly lists = new Map<string, { id: string; boardId: string }>();

  registerList(id: string, boardId: string) {
    this.lists.set(id, { id, boardId });
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<List | null> {
    const list = this.lists.get(id);
    if (!list || list.boardId !== boardId) return null;
    return list as unknown as List;
  }

  async create(): Promise<List> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async findAllByBoard(): Promise<List[]> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async countByBoard(): Promise<number> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async update(): Promise<List | null> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsCommentsService tests");
  }
}

class FakeBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, { id: string; memberIds: Set<string> }>();

  registerBoard(id: string, ...members: string[]) {
    this.boards.set(id, { id, memberIds: new Set(members) });
  }

  removeMember(id: string, userId: string) {
    this.boards.get(id)?.memberIds.delete(userId);
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    const board = this.boards.get(id);
    if (!board || !board.memberIds.has(userId)) return null;
    return board as unknown as Board;
  }

  async create(): Promise<Board> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by CardsCommentsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by CardsCommentsService tests");
  }
}

class FakeCommentRepository implements CommentRepository {
  readonly comments: CommentWithAuthor[] = [];
  private readonly authorsByUserId = new Map<string, { name: string; email: string }>();

  registerAuthor(userId: string, name: string, email: string) {
    this.authorsByUserId.set(userId, { name, email });
  }

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const author = this.authorsByUserId.get(data.authorId) ?? {
      name: data.authorId,
      email: `${data.authorId}@example.com`,
    };
    const comment: CommentWithAuthor = {
      id: crypto.randomUUID(),
      text: data.text,
      cardId: data.cardId,
      author: { id: data.authorId, name: author.name, email: author.email },
      createdAt: new Date(),
    };
    this.comments.push(comment);
    return comment;
  }

  async findAllByCardWithAuthor(cardId: string): Promise<CommentWithAuthor[]> {
    return this.comments
      .filter((c) => c.cardId === cardId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async deleteAllByCards(cardIds: string[]): Promise<number> {
    const before = this.comments.length;
    for (let i = this.comments.length - 1; i >= 0; i -= 1) {
      const comment = this.comments[i];
      if (comment && cardIds.includes(comment.cardId)) {
        this.comments.splice(i, 1);
      }
    }
    return before - this.comments.length;
  }
}

const OWNER = "owner-1";
const OTHER_MEMBER = "member-2";
const OUTSIDER = "outsider-1";

function buildService() {
  const commentRepository = new FakeCommentRepository();
  const cardRepository = new FakeCardRepository();
  const listRepository = new FakeListRepository();
  const boardRepository = new FakeBoardRepository();
  const service = new CardsCommentsService(
    commentRepository,
    cardRepository,
    listRepository,
    boardRepository,
  );
  return { service, commentRepository, cardRepository, listRepository, boardRepository };
}

async function buildBoardListCard(deps: ReturnType<typeof buildService>, ...members: string[]) {
  const boardId = crypto.randomUUID();
  deps.boardRepository.registerBoard(boardId, OWNER, ...members);
  const listId = crypto.randomUUID();
  deps.listRepository.registerList(listId, boardId);
  const cardId = crypto.randomUUID();
  deps.cardRepository.registerCard(cardId, listId);
  return { boardId, listId, cardId };
}

describe("CardsCommentsService.create (RN-01, RN-02, RN-05, critérios 1, 4, 5, 6)", () => {
  it("creates a comment belonging to the card, with text, author and timestamp (critério 1)", async () => {
    const deps = buildService();
    deps.commentRepository.registerAuthor(OWNER, "Owner One", "owner@example.com");
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    const comment = await deps.service.create(OWNER, boardId, listId, cardId, {
      text: "Ótimo trabalho",
    });

    expect(comment.cardId).toBe(cardId);
    expect(comment.text).toBe("Ótimo trabalho");
    expect(comment.author).toEqual({ id: OWNER, name: "Owner One", email: "owner@example.com" });
    expect(comment.createdAt).toBeInstanceOf(Date);
  });

  it("rejects when the caller is not a member of the board (critério 5)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.create(OUTSIDER, boardId, listId, cardId, { text: "X" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("rejects when the card does not exist in the given list (critério 6)", async () => {
    const deps = buildService();
    const { boardId, listId } = await buildBoardListCard(deps);

    await expect(
      deps.service.create(OWNER, boardId, listId, crypto.randomUUID(), { text: "X" }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });

  it("rejects when the list does not exist in the given board", async () => {
    const deps = buildService();
    const { boardId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.create(OWNER, boardId, crypto.randomUUID(), cardId, { text: "X" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("allows any member, not only an administrator, to comment (RN-03)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps, OTHER_MEMBER);

    await expect(
      deps.service.create(OTHER_MEMBER, boardId, listId, cardId, { text: "Comentário de membro" }),
    ).resolves.toMatchObject({ text: "Comentário de membro" });
  });
});

describe("CardsCommentsService.list (RN-04, RN-07, critérios 7, 8, 9, 10)", () => {
  it("returns every comment ordered from oldest to newest (critério 7)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps, OTHER_MEMBER);

    await deps.service.create(OWNER, boardId, listId, cardId, { text: "Primeiro" });
    await deps.service.create(OTHER_MEMBER, boardId, listId, cardId, { text: "Segundo" });

    const comments = await deps.service.list(OWNER, boardId, listId, cardId);

    expect(comments.map((c) => c.text)).toEqual(["Primeiro", "Segundo"]);
  });

  it("returns an empty history for a card with no comments, not an error (critério 8)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(deps.service.list(OWNER, boardId, listId, cardId)).resolves.toEqual([]);
  });

  it("keeps every comment from the same member separate, never merged (critério 9)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await deps.service.create(OWNER, boardId, listId, cardId, { text: "Um" });
    await deps.service.create(OWNER, boardId, listId, cardId, { text: "Dois" });

    const comments = await deps.service.list(OWNER, boardId, listId, cardId);

    expect(comments).toHaveLength(2);
    expect(comments.map((c) => c.text)).toEqual(["Um", "Dois"]);
  });

  it("rejects when the caller is not a member of the board (critério 10)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.list(OUTSIDER, boardId, listId, cardId),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("CardsCommentsService — autoria (RN-05, RN-06, critérios 11, 12)", () => {
  it("shows the commenting member as the author (critério 11)", async () => {
    const deps = buildService();
    deps.commentRepository.registerAuthor(OTHER_MEMBER, "Member Two", "member2@example.com");
    const { boardId, listId, cardId } = await buildBoardListCard(deps, OTHER_MEMBER);

    const comment = await deps.service.create(OTHER_MEMBER, boardId, listId, cardId, {
      text: "Comentário",
    });

    expect(comment.author.id).toBe(OTHER_MEMBER);
    expect(comment.author.name).toBe("Member Two");
  });

  it("keeps a comment's original author visible after that author leaves the board (critério 12)", async () => {
    const deps = buildService();
    deps.commentRepository.registerAuthor(OTHER_MEMBER, "Member Two", "member2@example.com");
    const { boardId, listId, cardId } = await buildBoardListCard(deps, OTHER_MEMBER);
    await deps.service.create(OTHER_MEMBER, boardId, listId, cardId, { text: "Antes de sair" });

    deps.boardRepository.removeMember(boardId, OTHER_MEMBER);

    const comments = await deps.service.list(OWNER, boardId, listId, cardId);
    expect(comments).toHaveLength(1);
    expect(comments[0]?.author).toEqual({
      id: OTHER_MEMBER,
      name: "Member Two",
      email: "member2@example.com",
    });
  });
});
