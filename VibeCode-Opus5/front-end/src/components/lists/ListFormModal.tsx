"use client";

import { useState, type FormEvent } from "react";
import { CloseIcon, DragHandleIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import type { BoardList } from "@/lib/lists";
import { parseApiError } from "@/lib/errors";

interface ListFormModalProps {
  /** Every list already on the board, ordered, used to build the position select. */
  lists: BoardList[];
  list?: BoardList | undefined;
  onClose: () => void;
  onSubmit: (input: { title: string; position: number }) => Promise<void>;
}

export function ListFormModal({
  lists,
  list,
  onClose,
  onSubmit,
}: ListFormModalProps) {
  const isEditing = Boolean(list);
  const slots = isEditing ? lists.length : lists.length + 1;

  const [title, setTitle] = useState(list?.title ?? "");
  const [position, setPosition] = useState(list?.position ?? lists.length);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview of the board order with the list already moved to the chosen slot.
  const others = lists.filter((item) => item.id !== list?.id);
  const preview = [
    ...others.slice(0, position),
    { id: list?.id ?? "draft", title: title.trim() || "Nova lista" },
    ...others.slice(position),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      await onSubmit({ title, position });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      setFieldErrors(parsed.fields);
      setFormError(parsed.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Lista</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Nome da lista"
          name="title"
          placeholder="Ex.: Em progresso"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors["title"]}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="position" className="text-sm text-foreground">
            Posição no quadro
          </label>
          <select
            id="position"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="w-full rounded-lg border border-line bg-background px-4 py-3 text-[15px] outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
          >
            {Array.from({ length: slots }, (_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </select>
        </div>

        <ul className="flex flex-col gap-2 rounded-lg border border-line p-3">
          {preview.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-md border border-line px-3 py-2.5 text-[15px] ${
                item.id === (list?.id ?? "draft")
                  ? "bg-navy/5 font-medium"
                  : "bg-surface"
              }`}
            >
              <span className="text-muted">
                <DragHandleIcon />
              </span>
              {item.title}
            </li>
          ))}
        </ul>

        {formError ? (
          <p role="alert" className="text-sm text-danger">
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
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-navy px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar lista
          </button>
        </div>
      </form>
    </Modal>
  );
}
