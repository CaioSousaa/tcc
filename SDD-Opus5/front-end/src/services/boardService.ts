import { api } from "@/lib/api";
import type { BoardColor } from "@/lib/boardColors";
import type { BoardRole } from "@/lib/permissions";
import type { LabelView } from "./labelService";

/** Checklist counts come aggregated from the API (RF06 C129); assignees in order of assignment (RF07 F94). */
export type CardSummary = {
  id: string;
  title: string;
  position: number;
  checklistTotal: number;
  checklistDone: number;
  assigneeIds: string[];
  /** In label order, resolved against `BoardDetail.labels` (RF08 F111). */
  labelIds: string[];
  /** Existing comments of the card (RF09 2.7). */
  commentCount: number;
  /** YYYY-MM-DD or null; the status is computed with the device's today (RF10 F138). */
  dueDate: string | null;
};

/** A participant of an open board, used to resolve avatars (RF07 F94). */
export type BoardMember = { userId: string; name: string; email: string; role: BoardRole };
export type MemberPreview = { userId: string; name: string };

/** Positions are exactly 1..N (RF03 RN05); `cardCount` always equals `cards.length` (RF04 RN17). */
export type BoardListItem = { id: string; name: string; position: number; cardCount: number; cards: CardSummary[] };

export type BoardSummary = {
  id: string;
  name: string;
  color: BoardColor;
  listCount: number;
  cardCount: number;
  /** Lists with cards cannot be deleted while true (RF05 RN03). */
  lockListDeletion: boolean;
  createdAt: string;
  updatedAt: string;
  /** Role of the signed-in account in this board; decides which controls are shown (RF07 F88). */
  myRole: BoardRole;
  memberCount: number;
  /** Up to 4 participants in order of entry. */
  memberPreview: MemberPreview[];
  /** Overdue cards relative to the `today` sent with the listing (RF10 F139). */
  overdueCount: number;
};

export type BoardDetail = BoardSummary & { members: BoardMember[]; labels: LabelView[]; lists: BoardListItem[] };

export type CreateBoardPayload = { name: string; color: BoardColor; withDefaultLists: boolean };
export type UpdateBoardPayload = { name: string; color: BoardColor; lockListDeletion: boolean };

export const boardService = {
  /** `today` of the device (YYYY-MM-DD) for the overdue count (RF10 F146). */
  async list(today: string): Promise<BoardSummary[]> {
    const { data } = await api.get<{ boards: BoardSummary[] }>("/boards", { params: { today } });
    return data.boards;
  },

  async get(boardId: string): Promise<BoardDetail> {
    const { data } = await api.get<{ board: BoardDetail }>(`/boards/${encodeURIComponent(boardId)}`);
    return data.board;
  },

  async create(payload: CreateBoardPayload): Promise<BoardDetail> {
    const { data } = await api.post<{ board: BoardDetail }>("/boards", payload);
    return data.board;
  },

  async update(boardId: string, payload: UpdateBoardPayload): Promise<BoardSummary> {
    const { data } = await api.put<{ board: BoardSummary }>(`/boards/${encodeURIComponent(boardId)}`, payload);
    return data.board;
  },

  async remove(boardId: string): Promise<void> {
    await api.delete(`/boards/${encodeURIComponent(boardId)}`);
  },
};
