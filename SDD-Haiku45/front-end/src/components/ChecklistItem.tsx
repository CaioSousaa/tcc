"use client";

import React, { useState } from "react";

interface ChecklistItemProps {
  id: string;
  title: string;
  isCompleted: boolean;
  onToggle: (itemId: string, isCompleted: boolean) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onEdit?: (itemId: string, newTitle: string) => Promise<void>;
  loading?: boolean;
}

export default function ChecklistItemComponent({
  id,
  title,
  isCompleted,
  onToggle,
  onDelete,
  onEdit,
  loading = false,
}: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleToggle = async () => {
    try {
      await onToggle(id, !isCompleted);
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editTitle.trim() !== title && onEdit) {
      try {
        await onEdit(id, editTitle.trim());
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to edit item:", error);
        setEditTitle(title);
      }
    } else {
      setIsEditing(false);
      setEditTitle(title);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 items-center py-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          maxLength={500}
          autoFocus
        />
        <button
          onClick={handleSaveEdit}
          disabled={loading}
          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditTitle(title);
          }}
          disabled={loading}
          className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-center py-2 px-2 hover:bg-gray-50 rounded">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggle}
        disabled={loading}
        className="w-4 h-4 cursor-pointer disabled:opacity-50"
      />
      <span
        className={`flex-1 text-sm ${
          isCompleted ? "line-through text-gray-500" : "text-gray-800"
        }`}
      >
        {title}
      </span>
      {onEdit && (
        <button
          onClick={() => setIsEditing(true)}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Editar
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  );
}
