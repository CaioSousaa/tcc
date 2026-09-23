import { listLists } from "@/lib/lists/api";
import { listCards } from "@/lib/cards/api";
import { Member, listMembers } from "@/lib/boards-members/api";

export interface BoardSummary {
  listCount: number;
  cardCount: number;
  overdueCount: number;
  members: Member[];
}

export async function fetchBoardSummary(boardId: string): Promise<BoardSummary> {
  const [lists, members] = await Promise.all([listLists(boardId), listMembers(boardId)]);
  const cardsByList = await Promise.all(lists.map((list) => listCards(boardId, list.id)));
  const cards = cardsByList.flat();

  return {
    listCount: lists.length,
    cardCount: cards.length,
    overdueCount: cards.filter((card) => card.dueDateStatus === "overdue").length,
    members,
  };
}
