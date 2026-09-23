"use client";

interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar Exclusão",
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <div className="text-sm text-gray-600 mb-4">{message}</div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deletando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
