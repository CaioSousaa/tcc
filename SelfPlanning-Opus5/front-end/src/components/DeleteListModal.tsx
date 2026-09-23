"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { FormMessage } from "./FormMessage";
import { BoardList, CardStrategy, DeleteListOptions } from "@/lib/listsApi";
import { getErrorMessage } from "@/lib/errors";

interface DeleteListModalProps {
  list: BoardList;
  lists: BoardList[];
  /** Contagem viva dos cards da coluna, que pode ser mais nova que a da listagem. */
  cardCount: number;
  blockListDeletionWithCards: boolean;
  onClose: () => void;
  onConfirm: (options: DeleteListOptions) => Promise<void>;
}

export function DeleteListModal({
  list,
  lists,
  cardCount,
  blockListDeletionWithCards,
  onClose,
  onConfirm,
}: DeleteListModalProps) {
  const otherLists = lists.filter((item) => item.id !== list.id);
  const hasCards = cardCount > 0;
  const isBlocked = hasCards && blockListDeletionWithCards;

  const [strategy, setStrategy] = useState<CardStrategy>(
    otherLists.length > 0 ? "move" : "delete"
  );
  const [targetListId, setTargetListId] = useState(otherLists[0]?.id ?? "");
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm(): Promise<void> {
    setError("");
    setIsConfirming(true);

    try {
      if (!hasCards) {
        await onConfirm({});
        return;
      }

      await onConfirm(
        strategy === "move" ? { strategy, targetListId } : { strategy: "delete" }
      );
    } catch (confirmError) {
      setError(getErrorMessage(confirmError, "Não foi possível excluir a lista."));
      setIsConfirming(false);
    }
  }

  return (
    <Modal title={`Excluir a lista "${list.name}"?`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted">
          {hasCards
            ? `Ela contém ${cardCount} ${
                cardCount === 1 ? "card" : "cards"
              }. Escolha o que deve acontecer com eles.`
            : "A lista está vazia e será excluída definitivamente."}
        </p>

        {isBlocked ? (
          <FormMessage message="A regra deste quadro bloqueia excluir uma lista que ainda tenha cards. Esvazie a lista ou desligue a regra na edição do quadro." />
        ) : null}

        {hasCards ? (
          <div className="flex flex-col gap-3">
            <label
              className={`flex gap-3 rounded-lg border p-4 ${
                strategy === "move" ? "border-brand" : "border-border"
              } ${otherLists.length === 0 ? "opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="card-strategy"
                className="mt-1 h-4 w-4 accent-brand"
                checked={strategy === "move"}
                disabled={otherLists.length === 0}
                onChange={() => setStrategy("move")}
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Mover os cards para outra lista
                </span>
                <span className="block text-xs text-muted">
                  {otherLists.length === 0
                    ? "Indisponível: este quadro não tem outra lista."
                    : "Recomendado. Nenhum card é perdido."}
                </span>

                {otherLists.length > 0 ? (
                  <select
                    value={targetListId}
                    onChange={(event) => setTargetListId(event.target.value)}
                    disabled={strategy !== "move"}
                    className="mt-3 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none focus:border-brand disabled:opacity-60"
                  >
                    {otherLists.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </span>
            </label>

            <label
              className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                strategy === "delete" ? "border-brand" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="card-strategy"
                className="mt-1 h-4 w-4 accent-brand"
                checked={strategy === "delete"}
                onChange={() => setStrategy("delete")}
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Excluir a lista e todos os cards
                </span>
                <span className="block text-xs text-muted">
                  Ação irreversível: {cardCount}{" "}
                  {cardCount === 1 ? "card será apagado" : "cards serão apagados"}.
                </span>
              </span>
            </label>

            <div className="flex gap-3 rounded-lg border border-border p-4 opacity-50">
              <input
                type="radio"
                name="card-strategy"
                className="mt-1 h-4 w-4 accent-brand"
                checked={false}
                disabled
                readOnly
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Bloquear exclusão enquanto houver cards
                </span>
                <span className="block text-xs text-muted">
                  {blockListDeletionWithCards
                    ? "Regra ligada neste quadro: a exclusão será recusada."
                    : "Indisponível: regra desligada na configuração do quadro."}
                </span>
              </span>
            </div>
          </div>
        ) : null}

        {error ? <FormMessage message={error} /> : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirming || isBlocked}
            className="h-11 rounded-lg bg-red-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
