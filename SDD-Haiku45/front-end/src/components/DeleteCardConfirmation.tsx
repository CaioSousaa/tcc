"use client";

import { useState } from "react";
import { useDeleteCard } from "../hooks/useCards";
import { ConfirmModal } from "./ConfirmModal";

interface DeleteCardConfirmationProps {
  cardId: string;
  listId: string;
  title: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteCardConfirmation({
  cardId,
  listId,
  title,
  onConfirm,
  onCancel,
}: DeleteCardConfirmationProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteCard } = useDeleteCard(listId, cardId);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteCard();
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar");
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmModal
      title="Deletar cartão?"
      message={`Tem certeza que deseja deletar "${title}"? Esta ação é irreversível.`}
      loading={isDeleting}
      error={error}
      onConfirm={handleDelete}
      onCancel={onCancel}
    />
  );
}
