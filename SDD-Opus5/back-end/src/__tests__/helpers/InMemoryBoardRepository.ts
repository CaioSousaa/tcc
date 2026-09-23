import { randomUUID } from "node:crypto";
import type { BoardDetail, BoardSummary } from "../../domain/boards";
import type { ListWithCards } from "../../domain/cards";
import type { ChecklistItem } from "../../domain/checklist";
import type { CommentView } from "../../domain/comments";
import type { LabelColor, LabelView } from "../../domain/labels";
import { MEMBER_PREVIEW_MAX, type AssigneeRef, type InvitationView, type MemberView } from "../../domain/members";
import type { BoardRole } from "../../domain/permissions";
import type { ListRecord } from "../../repositories/BoardListRepository";
import type {
  BoardChanges,
  BoardRepository,
  BoardScope,
  BoardTransaction,
  NewBoard,
} from "../../repositories/BoardRepository";
import type { LockResult } from "../../repositories/boardLock";
import { InMemoryBoardLock } from "./InMemoryBoardLock";

export type BoardRow = {
  id: string;
  ownerId: string;
  name: string;
  color: BoardSummary["color"];
  lockListDeletion: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type ListRow = ListRecord & { boardId: string; createdAt: Date };
export type ChecklistItemRow = ChecklistItem & { cardId: string };
export type UserRow = { id: string; name: string; email: string };
export type MemberRow = { boardId: string; userId: string; role: BoardRole; joinedAt: Date };
export type InvitationRow = { id: string; boardId: string; email: string; role: BoardRole; invitedBy: string; createdAt: Date };
export type AssigneeRow = { cardId: string; boardId: string; userId: string; assignedAt: Date };
export type LabelRow = { id: string; boardId: string; name: string; color: LabelColor; createdAt: Date };
export type CardLabelRow = { cardId: string; labelId: string; boardId: string };
export type CommentRow = { id: string; cardId: string; authorId: string; body: string; createdAt: Date; editedAt: Date | null };

export type CardRow = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  /** `YYYY-MM-DD` or null (RF10). */
  dueDate: string | null;
};

const memberKey = (boardId: string, userId: string) => `${boardId}:${userId}`;
const assigneeKey = (cardId: string, userId: string) => `${cardId}:${userId}`;
const cardLabelKey = (cardId: string, labelId: string) => `${cardId}:${labelId}`;

/**
 * Mirrors the database guarantees the services rely on: participation-scoped
 * statements (RF07 F77), transactional creation with the creator as administrator
 * (F85), ON DELETE CASCADE from boards to lists, cards, items, members, invitations
 * and assignments, and the composite foreign key from assignments to members (F83).
 */
export class InMemoryBoardRepository implements BoardRepository {
  readonly boards = new Map<string, BoardRow>();
  readonly lists = new Map<string, ListRow>();
  readonly cards = new Map<string, CardRow>();
  readonly checklistItems = new Map<string, ChecklistItemRow>();
  readonly users = new Map<string, UserRow>();
  readonly members = new Map<string, MemberRow>();
  readonly invitations = new Map<string, InvitationRow>();
  readonly assignees = new Map<string, AssigneeRow>();
  readonly labels = new Map<string, LabelRow>();
  readonly cardLabels = new Map<string, CardLabelRow>();
  readonly comments = new Map<string, CommentRow>();

  /** When set, list insertion fails inside the "transaction" (CE04). */
  failOnListInsert = false;

  /** Board lock shared by every repository built on this store. */
  readonly lock: InMemoryBoardLock;

  private clock = Date.parse("2026-01-01T00:00:00Z");

  constructor() {
    this.lock = new InMemoryBoardLock(this);
  }

  now(): Date {
    this.clock += 1000;
    return new Date(this.clock);
  }

  /** Users without a registered row get a name and e-mail derived from the id. */
  user(userId: string): UserRow {
    return this.users.get(userId) ?? { id: userId, name: `user-${userId.slice(0, 4)}`, email: `${userId}@test.dev` };
  }

  addUser(id: string, name: string, email: string): string {
    this.users.set(id, { id, name, email });
    return id;
  }

  roleOf(scope: BoardScope, boardId: string): BoardRole | undefined {
    if (!this.boards.has(boardId)) return undefined;
    return this.members.get(memberKey(boardId, scope.userId))?.role;
  }

  visible(scope: BoardScope, boardId: string): BoardRow | undefined {
    return this.roleOf(scope, boardId) ? this.boards.get(boardId) : undefined;
  }

  member(boardId: string, userId: string): MemberRow | undefined {
    return this.members.get(memberKey(boardId, userId));
  }

  /** Test helper standing in for an accepted invitation. */
  addMember(boardId: string, userId: string, role: BoardRole): void {
    this.members.set(memberKey(boardId, userId), { boardId, userId, role, joinedAt: this.now() });
  }

  /** Mirrors the composite foreign key with ON DELETE CASCADE (RF07 F83). */
  deleteMember(boardId: string, userId: string): void {
    this.members.delete(memberKey(boardId, userId));
    for (const [key, row] of [...this.assignees]) {
      if (row.boardId === boardId && row.userId === userId) this.assignees.delete(key);
    }
  }

  membersOf(boardId: string): MemberView[] {
    return [...this.members.values()]
      .filter((row) => row.boardId === boardId)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime() || (a.userId < b.userId ? -1 : 1))
      .map((row) => {
        const user = this.user(row.userId);
        return { userId: row.userId, name: user.name, email: user.email, role: row.role, joinedAt: row.joinedAt.toISOString() };
      });
  }

  invitationsOf(boardId: string): InvitationView[] {
    return [...this.invitations.values()]
      .filter((row) => row.boardId === boardId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : 1))
      .map(({ id, email, role, createdAt }) => ({ id, email, role, createdAt: createdAt.toISOString() }));
  }

  assigneesOf(cardId: string): AssigneeRef[] {
    return [...this.assignees.values()]
      .filter((row) => row.cardId === cardId)
      .sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime() || (a.userId < b.userId ? -1 : 1))
      .map((row) => ({ userId: row.userId, name: this.user(row.userId).name }));
  }

  boardOfCard(cardId: string): string | undefined {
    const card = this.cards.get(cardId);
    return card ? this.lists.get(card.listId)?.boardId : undefined;
  }

  /** Test helper: assignment written from the card's own board (D32). */
  assign(cardId: string, userId: string): void {
    const boardId = this.boardOfCard(cardId);
    if (!boardId || !this.member(boardId, userId)) throw new Error("violates foreign key constraint \"FK_card_assignees_member\"");
    const key = assigneeKey(cardId, userId);
    if (!this.assignees.has(key)) this.assignees.set(key, { cardId, boardId, userId, assignedAt: this.now() });
  }

  unassign(cardId: string, userId: string): void {
    this.assignees.delete(assigneeKey(cardId, userId));
  }

  /** Labels of a board in creation order with aggregated usage (RF08 F101, D40). */
  labelsOf(boardId: string): LabelView[] {
    return [...this.labels.values()]
      .filter((row) => row.boardId === boardId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : 1))
      .map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        usage: [...this.cardLabels.values()].filter((applied) => applied.labelId === row.id).length,
      }));
  }

  /** Label ids of a card in label order (F101). */
  cardLabelIdsOf(cardId: string): string[] {
    const applied = new Set([...this.cardLabels.values()].filter((row) => row.cardId === cardId).map((row) => row.labelId));
    const boardId = this.boardOfCard(cardId);
    return boardId ? this.labelsOf(boardId).filter((label) => applied.has(label.id)).map((label) => label.id) : [];
  }

  /** Test helper: a label created at the end of the order. */
  addLabel(boardId: string, name: string, color: LabelColor = "red"): string {
    const id = randomUUID();
    this.labels.set(id, { id, boardId, name, color, createdAt: this.now() });
    return id;
  }

  /** Mirrors the composite foreign key: label and card on the same board (RF08 F100, D38). */
  applyLabel(cardId: string, labelId: string): boolean {
    const boardId = this.boardOfCard(cardId);
    const label = this.labels.get(labelId);
    if (!boardId || !label || label.boardId !== boardId) return false;
    const key = cardLabelKey(cardId, labelId);
    if (!this.cardLabels.has(key)) this.cardLabels.set(key, { cardId, labelId, boardId });
    return true;
  }

  removeLabelFrom(cardId: string, labelId: string): void {
    this.cardLabels.delete(cardLabelKey(cardId, labelId));
  }

  /** Mirrors ON DELETE CASCADE from labels to card_labels (F99). */
  deleteLabel(labelId: string): void {
    this.labels.delete(labelId);
    for (const [key, row] of [...this.cardLabels]) if (row.labelId === labelId) this.cardLabels.delete(key);
  }

  /** History of a card in publication order, with author names (RF09 D43). */
  commentsOf(cardId: string): CommentView[] {
    return [...this.comments.values()]
      .filter((row) => row.cardId === cardId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : 1))
      .map((row) => ({
        id: row.id,
        author: { userId: row.authorId, name: this.user(row.authorId).name },
        body: row.body,
        createdAt: row.createdAt.toISOString(),
        edited: row.editedAt !== null,
      }));
  }

  /** Test helper: a comment published now by `authorId`. */
  addComment(cardId: string, authorId: string, body: string): string {
    const id = randomUUID();
    this.comments.set(id, { id, cardId, authorId, body, createdAt: this.now(), editedAt: null });
    return id;
  }

  cardsIn(listId: string): number {
    return [...this.cards.values()].filter((card) => card.listId === listId).length;
  }

  /** Items of a card in order (RF06 RN06). */
  itemsOf(cardId: string): ChecklistItem[] {
    return [...this.checklistItems.values()]
      .filter((item) => item.cardId === cardId)
      .sort((a, b) => a.position - b.position)
      .map(({ id, text, done, position }) => ({ id, text, done, position }));
  }

  /** Mirrors ON DELETE CASCADE from cards to checklist_items and card_assignees (RF06 F67, RF07 D35). */
  deleteCard(cardId: string): void {
    this.cards.delete(cardId);
    for (const item of [...this.checklistItems.values()]) if (item.cardId === cardId) this.checklistItems.delete(item.id);
    for (const [key, row] of [...this.assignees]) if (row.cardId === cardId) this.assignees.delete(key);
    for (const [key, row] of [...this.cardLabels]) if (row.cardId === cardId) this.cardLabels.delete(key);
    // Mirrors ON DELETE CASCADE from cards to card_comments (RF09 F123).
    for (const row of [...this.comments.values()]) if (row.cardId === cardId) this.comments.delete(row.id);
  }

  cardsOf(listId: string): CardRow[] {
    return [...this.cards.values()].filter((card) => card.listId === listId).sort((a, b) => a.position - b.position);
  }

  /** Same shape as loadListsWithCards: counts derived from the cards returned (RN17). */
  listsWithCards(boardId: string, listIds?: readonly string[]): ListWithCards[] {
    return [...this.lists.values()]
      .filter((list) => list.boardId === boardId && (listIds === undefined || listIds.includes(list.id)))
      .sort((a, b) => a.position - b.position)
      .map((list) => {
        const cards = this.cardsOf(list.id).map(({ id, title, position }) => {
          const items = this.itemsOf(id);
          return {
            id,
            title,
            position,
            checklistTotal: items.length,
            checklistDone: items.filter((item) => item.done).length,
            assigneeIds: this.assigneesOf(id).map((assignee) => assignee.userId),
            labelIds: this.cardLabelIdsOf(id),
            commentCount: this.commentsOf(id).length,
            dueDate: this.cards.get(id)?.dueDate ?? null,
          };
        });
        return { id: list.id, name: list.name, position: list.position, cardCount: cards.length, cards };
      });
  }

  /** Mirrors COALESCE($today, CURRENT_DATE) of the listing (RF10 F139). */
  static databaseToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  overdueCountOf(boardId: string, today: string | null): number {
    const reference = today ?? InMemoryBoardRepository.databaseToday();
    const listIds = new Set([...this.lists.values()].filter((l) => l.boardId === boardId).map((l) => l.id));
    return [...this.cards.values()].filter((c) => listIds.has(c.listId) && c.dueDate !== null && c.dueDate < reference).length;
  }

  summaryFor(userId: string, boardId: string, today: string | null = null): BoardSummary | null {
    const board = this.boards.get(boardId);
    const role = this.roleOf({ userId }, boardId);
    if (!board || !role) return null;
    const listIds = [...this.lists.values()].filter((l) => l.boardId === board.id).map((l) => l.id);
    const cardCount = [...this.cards.values()].filter((c) => listIds.includes(c.listId)).length;
    const members = this.membersOf(board.id);
    return {
      id: board.id,
      name: board.name,
      color: board.color,
      listCount: listIds.length,
      cardCount,
      lockListDeletion: board.lockListDeletion,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      myRole: role,
      memberCount: members.length,
      memberPreview: members.slice(0, MEMBER_PREVIEW_MAX).map(({ userId: id, name }) => ({ userId: id, name })),
      overdueCount: this.overdueCountOf(board.id, today),
    };
  }

  /** Mirrors ON DELETE CASCADE from boards (RF02 F13, RF07 RN15). */
  deleteBoard(boardId: string): void {
    this.boards.delete(boardId);
    for (const list of [...this.lists.values()]) {
      if (list.boardId !== boardId) continue;
      this.lists.delete(list.id);
      for (const card of [...this.cards.values()]) if (card.listId === list.id) this.deleteCard(card.id);
    }
    for (const row of [...this.members.values()]) if (row.boardId === boardId) this.deleteMember(boardId, row.userId);
    for (const row of [...this.invitations.values()]) if (row.boardId === boardId) this.invitations.delete(row.id);
    for (const row of [...this.labels.values()]) if (row.boardId === boardId) this.deleteLabel(row.id);
  }

  async listSummaries(scope: BoardScope, today: string | null = null): Promise<BoardSummary[]> {
    return [...this.boards.values()]
      .filter((b) => this.roleOf(scope, b.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1))
      .map((b) => this.summaryFor(scope.userId, b.id, today))
      .filter((summary): summary is BoardSummary => summary !== null);
  }

  async findSummary(scope: BoardScope, boardId: string): Promise<BoardSummary | null> {
    return this.summaryFor(scope.userId, boardId);
  }

  async findDetail(scope: BoardScope, boardId: string): Promise<BoardDetail | null> {
    const summary = this.summaryFor(scope.userId, boardId);
    if (!summary) return null;
    const members = this.membersOf(boardId).map(({ userId, name, email, role }) => ({ userId, name, email, role }));
    return { ...summary, members, labels: this.labelsOf(boardId), lists: this.listsWithCards(boardId) };
  }

  async createWithLists(scope: BoardScope, board: NewBoard): Promise<void> {
    const createdAt = this.now();
    const row: BoardRow = {
      id: board.id,
      ownerId: scope.userId,
      name: board.name,
      color: board.color,
      lockListDeletion: false,
      createdAt,
      updatedAt: createdAt,
    };
    const listRows = board.lists.map((l) => ({ ...l, boardId: board.id, createdAt }));

    if (this.failOnListInsert && listRows.length > 0) throw new Error("list insert failed");

    // Commit only after every step succeeded.
    this.boards.set(row.id, row);
    this.members.set(memberKey(row.id, scope.userId), { boardId: row.id, userId: scope.userId, role: "admin", joinedAt: createdAt });
    for (const list of listRows) this.lists.set(list.id, list);
  }

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: BoardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return this.lock.run(scope, boardId, (role) =>
      work(
        {
          update: async (changes: BoardChanges) => {
            const board = this.boards.get(boardId);
            if (!board) return;
            board.name = changes.name;
            board.color = changes.color;
            if (changes.lockListDeletion !== undefined) board.lockListDeletion = changes.lockListDeletion;
            board.updatedAt = this.now();
          },
          delete: async () => this.deleteBoard(boardId),
          summary: async () => this.summaryFor(scope.userId, boardId),
        },
        role,
      ),
    );
  }

  /** Test helpers standing in for RF03/RF04 operations. */
  addList(boardId: string, name: string): string {
    const id = randomUUID();
    const position = [...this.lists.values()].filter((l) => l.boardId === boardId).length + 1;
    this.lists.set(id, { id, boardId, name, position, createdAt: this.now() });
    return id;
  }

  addChecklistItem(cardId: string, text: string, done = false): string {
    const id = randomUUID();
    const position = Math.max(0, ...this.itemsOf(cardId).map((item) => item.position)) + 1;
    this.checklistItems.set(id, { id, cardId, text, done, position });
    return id;
  }

  addCard(listId: string, title = "card", description: string | null = null, dueDate: string | null = null): string {
    const id = randomUUID();
    const createdAt = this.now();
    this.cards.set(id, { id, listId, title, description, position: this.cardsIn(listId) + 1, createdAt, updatedAt: createdAt, dueDate });
    return id;
  }
}
