"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { LABEL_COLOR_HEX } from "@/lib/ui/colors";
import { LABEL_COLORS, Label, LabelColor } from "@/lib/labels/api";
import { Card } from "@/lib/cards/api";

export function LabelsModal({
  labels,
  card,
  onClose,
  onCreate,
  onRename,
  onChangeColor,
  onDelete,
  onToggleOnCard,
  cardUsageCount,
}: {
  labels: Label[];
  card?: Card;
  onClose: () => void;
  onCreate: (name: string, color: LabelColor) => Promise<void>;
  onRename: (label: Label) => void;
  onChangeColor: (labelId: string, color: LabelColor) => Promise<void>;
  onDelete: (labelId: string) => Promise<void>;
  onToggleOnCard?: (labelId: string, attached: boolean) => Promise<void>;
  cardUsageCount: Record<string, number>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColor>("azul");
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate(name, color);
      setName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal title="Etiquetas do quadro" onClose={onClose}>
      <p className="mb-4 text-sm text-muted">
        {card
          ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
          : "Gerencie as etiquetas disponíveis neste quadro."}
      </p>

      <ul className="mb-4 flex flex-col gap-1.5">
        {labels.map((label) => {
          const attached = card ? card.labels.some((l) => l.id === label.id) : false;
          return (
            <li
              key={label.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              {card && onToggleOnCard && (
                <input
                  type="checkbox"
                  checked={attached}
                  onChange={() => onToggleOnCard(label.id, attached)}
                  className="h-4 w-4 rounded border-border text-brand"
                />
              )}
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
              />
              <button
                type="button"
                onClick={() => onRename(label)}
                className="flex-1 text-left text-sm font-medium text-foreground hover:underline"
              >
                {label.name}
              </button>
              <span className="text-xs text-muted">{cardUsageCount[label.id] ?? 0}</span>
              <select
                value={label.color}
                onChange={(event) => onChangeColor(label.id, event.target.value as LabelColor)}
                aria-label={`Cor de ${label.name}`}
                className="rounded border border-border bg-surface px-1 py-0.5 text-xs"
              >
                {LABEL_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onDelete(label.id)}
                aria-label={`Excluir ${label.name}`}
                className="text-muted hover:text-red-600"
              >
                ×
              </button>
            </li>
          );
        })}
        {labels.length === 0 && (
          <p className="text-sm text-muted">Nenhuma etiqueta criada ainda.</p>
        )}
      </ul>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium text-foreground">Nova etiqueta</p>
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome"
              className="flex-1"
            />
            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar"}
            </Button>
          </div>
          <div className="flex gap-2">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-6 w-6 rounded-full ring-offset-2 ${color === c ? "ring-2 ring-brand" : ""}`}
                style={{ backgroundColor: LABEL_COLOR_HEX[c] }}
              />
            ))}
          </div>
        </form>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onClose}>
          Concluído
        </Button>
      </div>
    </Modal>
  );
}
