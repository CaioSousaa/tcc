"use client";

import { useState } from "react";

interface Column {
  id: string;
  name: string;
  position: number;
  card_count: number;
}

interface ColumnHeaderProps {
  column: Column;
  isEditing: boolean;
  onEditClick: () => void;
  onRename: (newName: string) => void;
  onRenameCancel: () => void;
  onDelete: () => void;
}

export function ColumnHeader({
  column,
  isEditing,
  onEditClick,
  onRename,
  onRenameCancel,
  onDelete,
}: ColumnHeaderProps) {
  const [editValue, setEditValue] = useState(column.name);

  const handleSave = () => {
    if (editValue.trim()) {
      onRename(editValue);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 px-2 py-1 border rounded text-sm"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Salvar
        </button>
        <button
          onClick={onRenameCancel}
          className="px-2 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
      <div>
        <h3 className="font-semibold text-gray-900">{column.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{column.card_count} card{column.card_count !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onEditClick}
          className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
          title="Editar"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600"
          title="Deletar"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
