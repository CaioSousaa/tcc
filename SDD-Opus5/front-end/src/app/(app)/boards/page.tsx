import type { Metadata } from "next";
import { BoardsView } from "./BoardsView";

export const metadata: Metadata = { title: "Meus quadros · Kanbo" };

export default function BoardsPage() {
  return <BoardsView />;
}
