"use client";

import { useEffect, useRef } from "react";
import { useCards } from "../hooks/useCards";
import CardItem from "./CardItem";
import AddCardButton from "./AddCardButton";

interface CardListProps {
  listId: string;
  boardId: string;
  listName: string;
  onCardCountChange?: (count: number) => void;
  selectedLabelIds?: string[];
  refreshToken?: number;
}

export default function CardList({ listId, boardId, onCardCountChange, selectedLabelIds = [], refreshToken = 0 }: CardListProps) {
  const { cards, loading, error, refetch } = useCards(listId);

  useEffect(() => {
    refetch();
  }, [listId, refetch, refreshToken]);

  const visibleCards =
    selectedLabelIds.length === 0
      ? cards
      : cards.filter((card) => card.labels?.some((l) => selectedLabelIds.includes(l.id)));

  const onCardCountChangeRef = useRef(onCardCountChange);
  onCardCountChangeRef.current = onCardCountChange;

  useEffect(() => {
    onCardCountChangeRef.current?.(cards.length);
  }, [cards.length]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && <p className="text-sm text-gray-500">Carregando...</p>}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Erro: {error}
          </div>
        )}

        {!loading && !error && visibleCards.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            {cards.length === 0 ? "Nenhum cartão" : "Nenhum cartão com as etiquetas selecionadas"}
          </p>
        )}

        {visibleCards.map((card) => (
          <CardItem
            key={card.id}
            id={card.id}
            listId={listId}
            boardId={boardId}
            title={card.title}
            description={card.description}
            position={card.position}
            labels={card.labels}
            assignees={card.assignees}
            checklist={card.checklist}
            onUpdate={refetch}
          />
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <AddCardButton listId={listId} onCardCreated={refetch} />
      </div>
    </div>
  );
}
