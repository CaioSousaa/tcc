"use client";

import { useCardLabels } from "@/hooks/useCardLabels";
import { useCardLabelManagement } from "@/hooks/useCardLabelManagement";
import LabelBadge from "./LabelBadge";

interface LabelListProps {
  cardId: string;
  boardId: string;
  canEdit?: boolean;
}

export default function LabelList({
  cardId,
  boardId,
  canEdit = false,
}: LabelListProps) {
  const { labels, loading, error, refetch } = useCardLabels(cardId);
  const { removeLabel } = useCardLabelManagement(boardId, cardId);

  const handleRemove = async (cardLabelId: string) => {
    try {
      const labelIndex = labels.findIndex((l) => {
        // Assume cardLabel ID is related to card_id and label_id
        // This is a simplified approach; backend provides direct ID
        return true;
      });

      if (labelIndex >= 0) {
        await removeLabel(cardLabelId);
        await refetch();
      }
    } catch (err) {
      console.error("Falha ao remover etiqueta", err);
    }
  };

  if (labels.length === 0) {
    return (
      <div className="text-sm text-gray-500">Nenhuma etiqueta</div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <LabelBadge
            key={label.id}
            name={label.name}
            color={label.color}
            onRemove={
              canEdit
                ? () => handleRemove(label.id)
                : undefined
            }
            readonly={!canEdit}
          />
        ))}
      </div>
    </div>
  );
}
