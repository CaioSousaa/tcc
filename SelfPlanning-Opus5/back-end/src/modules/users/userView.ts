import { User } from "./entities/User";

export interface UserView {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
