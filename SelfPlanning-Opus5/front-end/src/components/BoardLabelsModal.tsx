"use client";

import { useState } from "react";
import { FormMessage } from "./FormMessage";
import { Modal } from "./Modal";
import {
  LABEL_COLORS,
  LABEL_COLOR_HEX,
  LABEL_COLOR_LABEL,
  DEFAULT_LABEL_COLOR,
  LabelColor,
} from "@/lib/labelColors";
import {
  Label,
  LabelWithCount,
  applyLabelRequest,
  createLabelRequest,
  deleteLabelRequest,
  removeLabelRequest,
  updateLabelRequest,
} from "@/lib/labelsApi";
import { getErrorMessage } from "@/lib/errors";

interface BoardLabelsModalProps {
  boardId: string;
  labels: LabelWithCount[];
  isAdmin: boolean;
  /** Quando informado, o modal também marca as etiquetas aplicadas a este card. */
  cardId?: string;
  cardLabels?: Label[];
  onClose: () => void;
  onLabelsChange: (labels: LabelWithCount[]) => void;
  onCardLabelsChange?: (cardId: string, labels: Label[]) => void;
}

export function BoardLabelsModal({
  boardId,
  labels,
  isAdmin,
  cardId,
  cardLabels = [],
  onClose,
  onLabelsChange,
  onCardLabelsChange,
}: BoardLabelsModalProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>(DEFAULT_LABEL_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function run(action: () => Promise<void>, fallback: string): Promise<void> {
    setError("");
    setIsBusy(true);

    try {
      await action();
    } catch (actionError) {
      setError(getErrorMessage(actionError, fallback));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreate(): Promise<void> {
    const name = newName.trim();

    if (name.length === 0) {
      return;
    }

    await run(async () => {
      onLabelsChange(await createLabelRequest(boardId, name, newColor));
      setNewName("");
    }, "Não foi possível criar a etiqueta.");
  }

  async function handleRename(label: LabelWithCount): Promise<void> {
    const name = editingName.trim();

    setEditingId(null);

    if (name.length === 0 || name === label.name) {
      return;
    }

    await run(async () => {
      onLabelsChange(await updateLabelRequest(boardId, label.id, name, label.color));
    }, "Não foi possível salvar a etiqueta.");
  }

  async function handleToggleOnCard(label: LabelWithCount, applied: boolean): Promise<void> {
    if (!cardId || !onCardLabelsChange) {
      return;
    }

    await run(async () => {
      const updated = applied
        ? await removeLabelRequest(boardId, cardId, label.id)
        : await applyLabelRequest(boardId, cardId, label.id);

      onCardLabelsChange(cardId, updated);
      onLabelsChange(
        labels.map((item) =>
          item.id === label.id
            ? { ...item, cardCount: item.cardCount + (applied ? -1 : 1) }
            : item
        )
      );
    }, "Não foi possível atualizar a etiqueta do card.");
  }

  return (
    <Modal title="Etiquetas do quadro" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted">
          {cardId
            ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
            : "Organize as etiquetas usadas pelos cards deste quadro."}
        </p>

        <ul className="flex flex-col gap-2">
          {labels.map((label) => {
            const applied = cardLabels.some((item) => item.id === label.id);

            return (
              <li
                key={label.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                {cardId ? (
                  <input
                    type="checkbox"
                    checked={applied}
                    disabled={isBusy}
                    onChange={() => void handleToggleOnCard(label, applied)}
                    aria-label={label.name}
                    className="h-4 w-4 accent-brand"
                  />
                ) : null}

                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
                />

                {editingId === label.id ? (
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => void handleRename(label)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleRename(label);
                      }

                      if (event.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    maxLength={60}
                    className="h-9 flex-1 rounded-md border border-border bg-surface px-2.5 text-sm outline-none focus:border-brand"
                  />
                ) : (
                  <span className="flex-1 text-sm text-foreground">{label.name}</span>
                )}

                <span className="text-xs text-muted">{label.cardCount}</span>

                {isAdmin ? (
                  <>
                    <select
                      value={label.color}
                      disabled={isBusy}
                      onChange={(event) =>
                        void run(async () => {
                          onLabelsChange(
                            await updateLabelRequest(
                              boardId,
                              label.id,
                              label.name,
                              event.target.value as LabelColor
                            )
                          );
                        }, "Não foi possível trocar a cor.")
                      }
                      aria-label={`Cor de ${label.name}`}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-brand"
                    >
                      {LABEL_COLORS.map((color) => (
                        <option key={color} value={color}>
                          {LABEL_COLOR_LABEL[color]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(label.id);
                        setEditingName(label.name);
                      }}
                      aria-label={`Renomear ${label.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-foreground"
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        void run(async () => {
                          onLabelsChange(await deleteLabelRequest(boardId, label.id));
                        }, "Não foi possível excluir a etiqueta.")
                      }
                      aria-label={`Excluir ${label.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-red-700"
                    >
                      🗑
                    </button>
                  </>
                ) : null}
              </li>
            );
          })}

          {labels.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
              Nenhuma etiqueta neste quadro ainda.
            </li>
          ) : null}
        </ul>

        {isAdmin ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <span className="text-sm font-medium text-foreground">Nova etiqueta</span>

            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreate();
                  }
                }}
                placeholder="Nome"
                maxLength={60}
                className="h-11 flex-1 rounded-lg border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isBusy || newName.trim().length === 0}
                className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                Criar
              </button>
            </div>

            <div className="flex gap-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={LABEL_COLOR_LABEL[color]}
                  aria-pressed={newColor === color}
                  onClick={() => setNewColor(color)}
                  style={{ backgroundColor: LABEL_COLOR_HEX[color] }}
                  className={`h-8 w-8 rounded-md ${
                    newColor === color
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {error ? <FormMessage message={error} /> : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Concluído
          </button>
        </div>
      </div>
    </Modal>
  );
}
