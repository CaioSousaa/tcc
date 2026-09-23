"use client";

import CommentItem from "./CommentItem";

interface CommentData {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
}

interface CommentListProps {
  comments: CommentData[];
  isLoading: boolean;
  currentUserId?: string;
  userRole?: "admin" | "editor" | "viewer";
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

export default function CommentList({
  comments,
  isLoading,
  currentUserId = "",
  userRole = "viewer",
  onEdit,
  onDelete,
}: CommentListProps) {
  if (isLoading) {
    return <div className="text-center py-6 text-gray-500">Carregando comentários...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Nenhum comentário ainda. Seja o primeiro!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isAuthor = !!(comment.id && currentUserId && comment.id.includes(currentUserId));
        const canDeleteOther = userRole === "admin" || userRole === "editor";

        return (
          <CommentItem
            key={comment.id}
            id={comment.id}
            author_name={comment.author_name}
            content={comment.content}
            created_at={comment.created_at}
            updated_at={comment.updated_at}
            edited_at={comment.edited_at}
            isAuthor={isAuthor}
            canDeleteOther={canDeleteOther}
            onEdit={() => onEdit(comment.id)}
            onDelete={() => onDelete(comment.id)}
          />
        );
      })}
    </div>
  );
}
