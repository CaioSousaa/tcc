"use client";

import LabelBadge from "./LabelBadge";
import PrazoBadge from "./PrazoBadge";

interface Label {
  id: string;
  nome: string;
  cor: string;
}

interface Card {
  id: string;
  titulo: string;
  descricao?: string;
  dataPrazo?: string;
  statusPrazo?: string;
  checklistProgress?: {
    total: number;
    completed: number;
    percentage: number;
  };
  labels?: Label[];
}

interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  onEditLabels?: (cardId: string) => void;
  onDragStart?: (e: React.DragEvent, cardId: string, listaId: string) => void;
}

export function CardItem({ card, onEdit, onDelete, onEditLabels, onDragStart }: CardItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, card.id, "")}
      onClick={() => onEdit(card)}
      className="bg-white border border-gray-200 rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition group"
    >
      {card.labels && card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <LabelBadge key={label.id} nome={label.nome} cor={label.cor} />
          ))}
        </div>
      )}

      <div className="flex justify-between items-start gap-2">
        <p className="font-medium text-gray-900 text-sm wrap-break-word flex-1 min-w-0">
          {card.titulo}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          {onEditLabels && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditLabels(card.id);
              }}
              className="p-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 rounded"
              title="Editar etiquetas"
            >
              🏷
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="p-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded"
            title="Deletar"
          >
            ✕
          </button>
        </div>
      </div>

      {card.descricao && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {card.descricao}
        </p>
      )}

      {card.checklistProgress && card.checklistProgress.total > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${card.checklistProgress.percentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {card.checklistProgress.completed}/{card.checklistProgress.total}
          </span>
        </div>
      )}

      {card.dataPrazo && (
        <div className="mt-2">
          <PrazoBadge dataPrazo={card.dataPrazo} />
        </div>
      )}
    </div>
  );
}
