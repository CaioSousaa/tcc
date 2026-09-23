"use client";

import { useCommentForm } from "@/hooks/useCommentForm";
import { useCommentManagement } from "@/hooks/useCommentManagement";

interface CommentFormProps {
  cardId: string;
  boardId: string;
  onSuccess?: () => Promise<void>;
}

export default function CommentForm({ cardId, boardId, onSuccess }: CommentFormProps) {
  const { createComment } = useCommentManagement(boardId, cardId, onSuccess);

  const form = useCommentForm(createComment);
  const charCount = form.content.length;
  const maxChars = 1000;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <textarea
          value={form.content}
          onChange={(e) => form.setContent(e.target.value.slice(0, maxChars))}
          placeholder="Escrever um comentário..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          rows={3}
          disabled={form.loading}
        />
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {charCount}/{maxChars} caracteres
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => form.reset()}
              disabled={form.loading || !form.content.trim()}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={() => form.submit()}
              disabled={form.loading || !form.content.trim()}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {form.loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
      {form.error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {form.error}
        </div>
      )}
    </div>
  );
}
