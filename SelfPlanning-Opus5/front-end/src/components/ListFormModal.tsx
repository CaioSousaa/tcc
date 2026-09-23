"use client";

import { FormEvent, useState } from "react";
import { Modal } from "./Modal";
import { FormMessage } from "./FormMessage";
import { TextField } from "./TextField";
import { BoardList } from "@/lib/listsApi";
import { getErrorMessage } from "@/lib/errors";

interface ListFormModalProps {
  list?: BoardList;
  lists: BoardList[];
  onClose: () => void;
  onSubmit: (data: { name: string; position: number }) => Promise<void>;
}

/** Mesmo modal cria uma lista e renomeia ou reposiciona uma existente. */
export function ListFormModal({ list, lists, onClose, onSubmit }: ListFormModalProps) {
  const isEditing = list !== undefined;
  const positionCount = isEditing ? lists.length : lists.length + 1;

  const [name, setName] = useState(list?.name ?? "");
  const [position, setPosition] = useState(list?.position ?? lists.length);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({ name: name.trim(), position });
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Não foi possível salvar a lista."));
      setIsSubmitting(false);
    }
  }

  const preview = lists.filter((item) => item.id !== list?.id);
  const previewWithMoved = [
    ...preview.slice(0, position),
    { id: list?.id ?? "nova", name: name.trim() || "Nova lista", moved: true },
    ...preview.slice(position),
  ];

  return (
    <Modal title="Lista" onClose={onClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Nome da lista"
          placeholder="Ex.: Em progresso"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="list-position" className="text-sm text-foreground">
            Posição no quadro
          </label>
          <select
            id="list-position"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none focus:border-brand"
          >
            {Array.from({ length: positionCount }, (_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </select>
        </div>

        <ul className="flex flex-col gap-2 rounded-lg border border-border p-3">
          {previewWithMoved.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm ${
                "moved" in item ? "bg-background font-medium text-foreground" : "text-muted"
              }`}
            >
              <span aria-hidden className="text-muted">
                =
              </span>
              {item.name}
            </li>
          ))}
        </ul>

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
            type="submit"
            disabled={isSubmitting || name.trim().length === 0}
            className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar lista
          </button>
        </div>
      </form>
    </Modal>
  );
}
