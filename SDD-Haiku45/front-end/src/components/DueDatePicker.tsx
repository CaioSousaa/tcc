"use client";

import React, { useState } from "react";
import { useDueDateManagement } from "@/hooks/useDueDateManagement";

interface DueDatePickerProps {
  cardId: string;
  boardId: string;
  currentDueDate: string | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export function DueDatePicker({
  cardId,
  boardId,
  currentDueDate,
  onSave,
  onCancel,
}: DueDatePickerProps) {
  const listId = ""; // Will be passed from parent context
  const [dueDate, setDueDate] = useState(currentDueDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setDueDate: apiSetDueDate, removeDueDate: apiRemoveDueDate, error } = useDueDateManagement(
    listId,
    cardId,
    onSave
  );

  const handleSave = async () => {
    if (!dueDate) {
      return;
    }

    try {
      setIsSubmitting(true);
      await apiSetDueDate(dueDate);
    } catch (err) {
      console.error("Erro ao salvar data:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsSubmitting(true);
      await apiRemoveDueDate();
      setDueDate("");
    } catch (err) {
      console.error("Erro ao remover data:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
        disabled={isSubmitting}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !dueDate}
          className="bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50"
        >
          Salvar
        </button>

        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-gray-300 text-black px-3 py-2 rounded disabled:opacity-50"
        >
          Cancelar
        </button>

        {currentDueDate && (
          <button
            onClick={handleRemove}
            disabled={isSubmitting}
            className="bg-red-500 text-white px-3 py-2 rounded disabled:opacity-50"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
