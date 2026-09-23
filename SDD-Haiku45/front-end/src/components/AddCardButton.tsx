"use client";

import { useState } from "react";
import { useCreateCard } from "../hooks/useCards";

interface AddCardButtonProps {
  listId: string;
  onCardCreated: () => Promise<void>;
}

export default function AddCardButton({ listId, onCardCreated }: AddCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { createCard } = useCreateCard(listId);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Título não pode estar vazio");
      return;
    }

    if (title.length > 255) {
      setError("Título muito longo (máximo 255 caracteres)");
      return;
    }

    if (description.length > 5000) {
      setError("Descrição muito longa (máximo 5000 caracteres)");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createCard(title, description);
      setTitle("");
      setDescription("");
      setIsOpen(false);
      await onCardCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cartão");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded hover:bg-gray-100 w-full text-left"
      >
        + Adicionar Cartão
      </button>
    );
  }

  return (
    <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do cartão"
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        maxLength={255}
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
        rows={2}
        maxLength={5000}
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsOpen(false);
            setTitle("");
            setDescription("");
            setError(null);
          }}
          disabled={isCreating}
          className="flex-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex-1 px-3 py-2 text-white bg-blue-600 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? "Criando..." : "Criar"}
        </button>
      </div>
    </div>
  );
}
