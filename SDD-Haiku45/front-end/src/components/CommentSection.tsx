"use client";

import { useState } from "react";
import { useComments } from "@/hooks/useComments";
import { useCommentManagement } from "@/hooks/useCommentManagement";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import CommentEditForm from "./CommentEditForm";

interface CommentSectionProps {
  cardId: string;
  boardId: string;
  currentUserId?: string;
  userRole?: "admin" | "editor" | "viewer";
}

interface EditingComment {
  id: string;
  content: string;
}

export default function CommentSection({
  cardId,
  boardId,
  currentUserId = "",
  userRole = "viewer",
}: CommentSectionProps) {
  const { comments, loading: commentsLoading, error: commentsError, refetch } = useComments(
    cardId
  );
  const { updateComment, deleteComment, loading: actionLoading } = useCommentManagement(
    boardId,
    cardId,
    refetch
  );

  const [editingComment, setEditingComment] = useState<EditingComment | null>(null);

  const handleEdit = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditingComment({ id: comment.id, content: comment.content });
    }
  };

  const handleSaveEdit = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
      setEditingComment(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("Tem certeza que deseja deletar este comentário?")) {
      try {
        await deleteComment(commentId);
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Comentários ({comments.length})</h3>

        {commentsError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
            {commentsError}
          </div>
        )}

        <CommentList
          comments={comments}
          isLoading={commentsLoading}
          currentUserId={currentUserId}
          userRole={userRole}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Adicionar comentário</h4>
        <CommentForm cardId={cardId} boardId={boardId} onSuccess={refetch} />
      </div>

      {editingComment && (
        <CommentEditForm
          comment={editingComment}
          boardId={boardId}
          cardId={cardId}
          onSave={handleSaveEdit}
          onCancel={() => setEditingComment(null)}
        />
      )}
    </div>
  );
}
