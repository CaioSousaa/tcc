export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}
