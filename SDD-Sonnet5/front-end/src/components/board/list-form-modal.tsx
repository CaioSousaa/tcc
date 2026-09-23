"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/field";
import { List } from "@/lib/lists/api";

export function ListFormModal({
  list,
  allLists,
  onClose,
  onSubmit,
}: {
  list?: List;
  allLists: List[];
  onClose: () => void;
  onSubmit: (input: { name: string; position?: number }) => Promise<void>;
}) {
  const currentIndex = list ? allLists.findIndex((l) => l.id === list.id) : -1;
  const [name, setName] = useState(list?.name ?? "");
  const [position, setPosition] = useState(currentIndex >= 0 ? currentIndex : allLists.length);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name,
        position: list && position !== currentIndex ? position : undefined,
      });
    } catch {
      setError("Não foi possível salvar a lista.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Lista" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nome da lista" error={error ?? undefined}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>

        {list && (
          <Field label="Posição no quadro">
            <Select
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
            >
              {allLists.map((_, index) => (
                <option key={index} value={index}>
                  {index + 1}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {allLists.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-lg border border-border p-2">
            {allLists.map((l) => (
              <li
                key={l.id}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                  list?.id === l.id ? "bg-black/5 font-medium text-foreground" : "text-muted"
                }`}
              >
                <span className="text-muted">≡</span> {l.name}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar lista"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
