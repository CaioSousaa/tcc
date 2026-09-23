"use client";

import React, { useState } from "react";
import { useChecklist } from "@/hooks/useChecklist";
import { useChecklistItem } from "@/hooks/useChecklistItem";
import ChecklistProgress from "./ChecklistProgress";
import ChecklistList from "./ChecklistList";
import ChecklistForm from "./ChecklistForm";

interface ChecklistSectionProps {
  cardId: string;
  boardId: string;
}

export default function ChecklistSection({
  cardId,
  boardId,
}: ChecklistSectionProps) {
  const { checklist, loading: checklistLoading, error: checklistError, refetch, createChecklist } = useChecklist(
    cardId,
    boardId
  );

  const checklistItemHook = useChecklistItem(
    cardId,
    boardId,
    checklist?.id || null,
    refetch
  );

  const [creatingChecklist, setCreatingChecklist] = useState(false);

  const handleCreateChecklist = async () => {
    setCreatingChecklist(true);
    try {
      await createChecklist();
    } catch (error) {
      console.error("Failed to create checklist:", error);
    } finally {
      setCreatingChecklist(false);
    }
  };

  if (checklistLoading) {
    return (
      <div className="text-sm text-gray-500">
        Carregando checklist...
      </div>
    );
  }

  if (checklistError && !checklist) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
        {checklistError}
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Checklist</h3>
        <button
          onClick={handleCreateChecklist}
          disabled={creatingChecklist}
          className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
        >
          {creatingChecklist ? "Criando..." : "Adicionar Checklist"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Checklist ({checklist.progress.completed} de {checklist.progress.total})
        </h3>

        {checklist.progress.total > 0 && (
          <ChecklistProgress
            completed={checklist.progress.completed}
            total={checklist.progress.total}
            percentage={checklist.progress.percentage}
          />
        )}

        <div className="mt-3">
          <ChecklistList
            items={checklist.items}
            isLoading={checklistItemHook.loading}
            onToggle={(itemId, isCompleted) =>
              checklistItemHook.updateItem(itemId, { is_completed: isCompleted })
            }
            onDelete={(itemId) => checklistItemHook.removeItem(itemId)}
            onEdit={(itemId, newTitle) =>
              checklistItemHook.updateItem(itemId, { title: newTitle })
            }
          />
        </div>
      </div>

      <ChecklistForm
        onAddItem={(title) => checklistItemHook.addItem(title)}
        loading={checklistItemHook.loading}
        error={checklistItemHook.error}
      />
    </div>
  );
}
