"use client";

interface CommentItemProps {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  isAuthor: boolean;
  canDeleteOther: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CommentItem({
  id,
  author_name,
  content,
  created_at,
  updated_at,
  edited_at,
  isAuthor,
  canDeleteOther,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const showEditedIndicator = edited_at && new Date(edited_at) > new Date(created_at);

  return (
    <div className="border-l-4 border-gray-300 pl-4 py-3">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="font-medium text-sm text-gray-900">{author_name}</div>
          <div className="text-xs text-gray-500 mt-1">{formatDate(created_at)}</div>
          {showEditedIndicator && (
            <div className="text-xs text-gray-400 italic">
              editado em {formatDate(edited_at!)}
            </div>
          )}
        </div>
        {(isAuthor || canDeleteOther) && (
          <div className="flex gap-2">
            {isAuthor && (
              <button
                onClick={onEdit}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Editar
              </button>
            )}
            {(isAuthor || canDeleteOther) && (
              <button
                onClick={onDelete}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Deletar
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-700 break-words">{content}</div>
    </div>
  );
}
