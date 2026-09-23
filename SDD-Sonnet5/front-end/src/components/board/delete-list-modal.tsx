"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { List } from "@/lib/lists/api";

export function DeleteListModal({
  list,
  cardCount,
  onClose,
  onConfirm,
}: {
  list: List;
  cardCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal title={`⚠️ Excluir a lista "${list.name}"?`} onClose={onClose}>
      {cardCount > 0 ? (
        <p className="text-sm text-muted">
          Ela contém {cardCount} card{cardCount === 1 ? "" : "s"}. Excluir a lista vai excluir{" "}
          {cardCount === 1 ? "esse card" : "esses cards"}, seus checklists e comentários também.
          Essa ação não pode ser desfeita.
        </p>
      ) : (
        <p className="text-sm text-muted">Essa ação não pode ser desfeita.</p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="border border-red-600 bg-red-600 text-white hover:bg-red-700"
          onClick={handleConfirm}
          disabled={deleting}
        >
          {deleting ? "Excluindo..." : "Confirmar"}
        </Button>
      </div>
    </Modal>
  );
}
