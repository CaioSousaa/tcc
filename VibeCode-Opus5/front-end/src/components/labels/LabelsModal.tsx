"use client";

import { useState, type FormEvent } from "react";
import { CloseIcon, TrashIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { parseApiError } from "@/lib/errors";
import {
  LABEL_COLORS,
  LABEL_COLOR_HEX,
  type Label,
  type LabelColor,
  type LabelInput,
} from "@/lib/labels";

interface LabelsModalProps {
  labels: Label[];
  isAdmin: boolean;
  usageCounts: Record<string, number>;
  /** When set, each label renders as a checkbox toggling its assignment on this card. */
  assignedLabelIds?: string[] | undefined;
  onToggleAssign?: ((label: Label, assign: boolean) => Promise<void>) | undefined;
  onCreate: (input: LabelInput) => Promise<void>;
  onDelete: (labelId: string) => Promise<void>;
  onClose: () => void;
}

export function LabelsModal({
  labels,
  isAdmin,
  usageCounts,
  assignedLabelIds,
  onToggleAssign,
  onCreate,
  onDelete,
  onClose,
}: LabelsModalProps) {
  const isAssignMode = Boolean(assignedLabelIds && onToggleAssign);

  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColor>("red");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      await onCreate({ name, color });
      setName("");
    } catch (createError) {
      setError(parseApiError(createError).message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggle(label: Label) {
    setError("");

    try {
      await onToggleAssign?.(label, !assignedLabelIds?.includes(label.id));
    } catch (toggleError) {
      setError(parseApiError(toggleError).message);
    }
  }

  async function handleDelete(labelId: string) {
    setError("");

    try {
      await onDelete(labelId);
    } catch (deleteError) {
      setError(parseApiError(deleteError).message);
    }
  }

  return (
    <Modal
      onClose={onClose}
      width="max-w-[480px]"
      title={
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Etiquetas do quadro
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isAssignMode
                ? "Marque as etiquetas aplicadas a este card."
                : "Gerencie as etiquetas disponíveis no quadro."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>
      }
    >
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {labels.length === 0 ? (
        <p className="py-2 text-sm text-muted">
          Nenhuma etiqueta criada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {labels.map((label) => (
            <li
              key={label.id}
              className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
            >
              {isAssignMode ? (
                <input
                  type="checkbox"
                  checked={assignedLabelIds?.includes(label.id) ?? false}
                  onChange={() => handleToggle(label)}
                  className="h-4 w-4 shrink-0 accent-navy"
                />
              ) : null}

              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
              />

              <span className="min-w-0 flex-1 truncate text-[15px]">
                {label.name}
              </span>

              <span className="shrink-0 text-xs text-muted">
                {usageCounts[label.id] ?? 0}
              </span>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleDelete(label.id)}
                  aria-label={`Excluir etiqueta ${label.name}`}
                  title="Excluir etiqueta"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition hover:text-danger"
                >
                  <TrashIcon />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isAdmin ? (
        <form
          onSubmit={handleCreateSubmit}
          className="mt-5 flex flex-col gap-3 border-t border-line pt-4"
        >
          <span className="text-sm font-medium text-foreground">
            Nova etiqueta
          </span>

          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome"
              required
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/15"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="shrink-0 rounded-lg bg-navy px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Criando..." : "Criar"}
            </button>
          </div>

          <div className="flex gap-2">
            {LABEL_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Cor ${option}`}
                className={`h-7 w-7 rounded-full transition ${
                  color === option ? "ring-2 ring-offset-2 ring-navy" : ""
                }`}
                style={{ backgroundColor: LABEL_COLOR_HEX[option] }}
              />
            ))}
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
