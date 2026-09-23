"use client";

interface AssigneeListProps {
  assignees: { id: string; member_name: string }[];
  error?: string | null;
  loading?: boolean;
  onRemove?: (assignmentId: string) => Promise<void>;
}

export default function AssigneeList({ assignees, error = null, loading = false, onRemove }: AssigneeListProps) {
  const handleRemove = async (assignmentId: string) => {
    try {
      await onRemove?.(assignmentId);
    } catch (err) {
      // Error is handled by useAssignees
    }
  };

  if (assignees.length === 0) {
    return (
      <div className="text-sm text-gray-500">Nenhum responsável atribuído</div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {assignees.map((assignee) => (
          <div
            key={assignee.id}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <span>{assignee.member_name}</span>
            <button
              onClick={() => handleRemove(assignee.id)}
              className="ml-1 text-blue-800 hover:text-blue-900 font-bold"
              disabled={loading}
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
