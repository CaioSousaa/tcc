import { BoardView } from "./BoardView";

// params is async in Next.js 16 (plan A30); the id format is validated by the API.
export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return <BoardView key={boardId} boardId={boardId} />;
}
