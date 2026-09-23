"use client";

import React from "react";
import ChecklistItemComponent from "./ChecklistItem";

interface ChecklistItemData {
  id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

interface ChecklistListProps {
  items: ChecklistItemData[];
  isLoading?: boolean;
  onToggle: (itemId: string, isCompleted: boolean) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onEdit?: (itemId: string, newTitle: string) => Promise<void>;
}

export default function ChecklistList({
  items,
  isLoading = false,
  onToggle,
  onDelete,
  onEdit,
}: ChecklistListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        Nenhum item ainda. Adicione um para começar.
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-1 border-t pt-2">
      {sortedItems.map((item) => (
        <ChecklistItemComponent
          key={item.id}
          id={item.id}
          title={item.title}
          isCompleted={item.is_completed}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          loading={isLoading}
        />
      ))}
    </div>
  );
}
