export type BoardRole = "admin" | "member";

export interface BoardMember {
  id: string;
  role: BoardRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
