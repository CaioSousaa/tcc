import type { BoardColor } from "./boardColors";

export const BOARD_NAME_MAX = 60;

import type { ListWithCards } from "./cards";
import type { LabelView } from "./labels";
import type { BoardMember, MemberPreview } from "./members";
import type { BoardRole } from "./permissions";

/** Default lists, in order (RN07). Positions are 1-based: index + 1 (RF03 plan C49). */
export const DEFAULT_LIST_NAMES = ["A fazer", "Em progresso", "Concluído"] as const;

export type BoardSummary = {
  id: string;
  name: string;
  color: BoardColor;
  listCount: number;
  cardCount: number;
  /** When true, lists that contain cards cannot be deleted (RF05 RN03). */
  lockListDeletion: boolean;
  createdAt: string;
  updatedAt: string;
  /** Role of the account that reads the board, read at processing time (RF07 F88). */
  myRole: BoardRole;
  memberCount: number;
  /** Up to 4 participants in order of entry (RF07 spec 2.1). */
  memberPreview: MemberPreview[];
  /** Cards with a due date before the viewer's today (RF10 RN07, F139). */
  overdueCount: number;
};

export type BoardDetail = BoardSummary & { members: BoardMember[]; labels: LabelView[]; lists: ListWithCards[] };
