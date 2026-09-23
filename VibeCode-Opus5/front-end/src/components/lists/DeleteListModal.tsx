"use client";

import { useState } from "react";
import { AlertIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { parseApiError } from "@/lib/errors";
import type { BoardList, DeleteListInput } from "@/lib/lists";

interface DeleteListModalProps {
  list: BoardList;
  cardCount: number;
  otherLists: BoardList[];
  onClose: () => void;
  onConfirm: (input: DeleteListInput) => Promise<void>;
}

export function DeleteListModal({
  list,
  cardCount,
  otherLists,
  onClose,
  onConfirm,
}: DeleteListModalProps) {
  const canMove = cardCount > 0 && otherLists.length > 0;

  const [mode, setMode] = useState<"move" | "delete">(
    canMove ? "move" : "delete",
  );
  const [targetListId, setTargetListId] = useState(otherLists[0]?.id ?? "");
  const [formError, setFormError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setFormError("");
    setIsDeleting(true);

    try {
      await onConfirm(
        mode === "move" ? { mode: "move", targetListId } : { mode: "delete" },
      );
      onClose();
    } catch (error) {
      setFormError(parseApiError(error).message);
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      width="max-w-[500px]"
      title={
        <div className="mb-5 flex gap-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
            <AlertIcon />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Excluir a lista “{list.title}”?
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              {cardCount > 0
                ? `Ela contém ${cardCount} ${
                    cardCount === 1 ? "card" : "cards"
                  }. Escolha o que deve acontecer com eles.`
                : "Ação irreversível. As listas seguintes sobem uma posição no quadro."}
            </p>
          </div>
        </div>
      }
    >
      {cardCount > 0 ? (
        <div className="mb-5 flex flex-col gap-3">
          {canMove ? (
            <label
              className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition ${
                mode === "move" ? "border-navy bg-navy/5" : "border-line"
              }`}
            >
              <span className="flex items-center gap-2 text-[15px] font-medium">
                <input
                  type="radio"
                  name="delete-list-mode"
                  checked={mode === "move"}
                  onChange={() => setMode("move")}
                />
                Mover os cards para outra lista
              </span>
              <span className="text-xs text-muted">
                Recomendado. Nenhum card é perdido.
              </span>
              {mode === "move" ? (
                <select
                  value={targetListId}
                  onChange={(event) => setTargetListId(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
                >
                  {otherLists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              ) : null}
            </label>
          ) : null}

          <label
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition ${
              mode === "delete" ? "border-danger bg-danger/5" : "border-line"
            }`}
          >
            <span className="flex items-center gap-2 text-[15px] font-medium">
              <input
                type="radio"
                name="delete-list-mode"
                checked={mode === "delete"}
                onChange={() => setMode("delete")}
              />
              Excluir a lista e todos os cards
            </span>
            <span className="text-xs text-muted">
              Ação irreversível: {cardCount}{" "}
              {cardCount === 1 ? "card será apagado" : "cards serão apagados"}.
            </span>
          </label>
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-line px-4 py-2.5 text-[15px] font-medium text-foreground transition hover:bg-background"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting || (mode === "move" && !targetListId)}
          className="rounded-lg bg-danger px-5 py-2.5 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Excluindo..." : "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
