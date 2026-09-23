"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { List } from "@/lib/lists";

interface DeleteListDialogProps {
  list: List;
  cardCount: number;
  otherLists: List[];
  submitting: boolean;
  onConfirm: (strategy: "move" | "delete", destinationListId?: string) => void;
  onCancel: () => void;
}

export function DeleteListDialog({
  list,
  cardCount,
  otherLists,
  submitting,
  onConfirm,
  onCancel,
}: DeleteListDialogProps) {
  const [strategy, setStrategy] = useState<"move" | "delete">(
    otherLists.length > 0 ? "move" : "delete"
  );
  const [destinationListId, setDestinationListId] = useState(otherLists[0]?.id ?? "");

  function handleConfirm() {
    if (strategy === "move") {
      onConfirm("move", destinationListId);
    } else {
      onConfirm("delete");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Excluir a lista &quot;{list.name}&quot;?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ela contém {cardCount} {cardCount === 1 ? "card" : "cards"}. Escolha o que deve
              acontecer com eles.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label
            className={`flex cursor-pointer flex-col gap-2 rounded-md border p-3 ${
              strategy === "move" ? "border-slate-500 bg-slate-50" : "border-zinc-200"
            } ${otherLists.length === 0 ? "opacity-40" : ""}`}
          >
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="strategy"
                checked={strategy === "move"}
                disabled={otherLists.length === 0}
                onChange={() => setStrategy("move")}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  Mover os cards para outra lista
                </span>
                <span className="block text-xs text-slate-500">
                  Recomendado. Nenhum card é perdido.
                </span>
              </span>
            </span>
            {strategy === "move" && (
              <select
                value={destinationListId}
                onChange={(e) => setDestinationListId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              >
                {otherLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label
            className={`flex items-start gap-2 rounded-md border p-3 ${
              strategy === "delete" ? "border-red-400 bg-red-50" : "border-zinc-200"
            }`}
          >
            <input
              type="radio"
              name="strategy"
              checked={strategy === "delete"}
              onChange={() => setStrategy("delete")}
              className="mt-0.5"
            />
            <span>
              <span
                className={`block text-sm font-medium ${
                  strategy === "delete" ? "text-red-700" : "text-slate-800"
                }`}
              >
                Excluir a lista e todos os cards
              </span>
              <span className="block text-xs text-slate-500">
                Ação irreversível: {cardCount} {cardCount === 1 ? "card" : "cards"}, checklists e
                comentários serão apagados.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || (strategy === "move" && !destinationListId)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
