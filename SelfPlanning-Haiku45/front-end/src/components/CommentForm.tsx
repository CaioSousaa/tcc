import { useState } from "react";

interface CommentFormProps {
  onSubmit: (texto: string) => Promise<void>;
  loading?: boolean;
}

export default function CommentForm({ onSubmit, loading = false }: CommentFormProps) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (texto.trim().length === 0) {
      setError("Comentário não pode estar vazio");
      return;
    }

    if (texto.length > 1000) {
      setError("Comentário não pode ter mais de 1000 caracteres");
      return;
    }

    try {
      await onSubmit(texto);
      setTexto("");
    } catch (err) {
      setError("Erro ao enviar comentário");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={1000}
        placeholder="Adicione um comentário..."
        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white text-sm resize-none"
        rows={3}
        disabled={loading}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {texto.length}/1000
        </span>
        <button
          type="submit"
          disabled={loading || texto.trim().length === 0}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Enviando..." : "Comentar"}
        </button>
      </div>
    </form>
  );
}
