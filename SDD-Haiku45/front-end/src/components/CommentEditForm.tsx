"use client";

import { useState } from "react";

interface CommentData {
  id: string;
  content: string;
}

interface CommentEditFormProps {
  comment: CommentData;
  boardId: string;
  cardId: string;
  onSave: (commentId: string, content: string) => Promise<void>;
  onCancel: () => void;
}

export default function CommentEditForm({
  comment,
  boardId,
  cardId,
  onSave,
  onCancel,
}: CommentEditFormProps) {
  const [content, setContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const maxChars = 1000;

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Comment content is required");
      return;
    }

    if (content.length > maxChars) {
      setError(`Comment must not exceed ${maxChars} characters`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(comment.id, content.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Editar comentário</h2>

        <div className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={4}
            disabled={loading}
          />

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {charCount}/{maxChars} caracteres
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
