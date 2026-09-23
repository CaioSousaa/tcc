"use client";

import { useState, ReactNode } from "react";

interface List {
  id: string;
  titulo: string;
  ordem: number;
}

interface ListColumnProps {
  list: List;
  children?: ReactNode;
  cardCount?: number;
  onRename: (listId: string, novoTitulo: string) => Promise<void>;
  onDelete: (listId: string) => Promise<void>;
  onReorderUp: () => Promise<void>;
  onReorderDown: () => Promise<void>;
  onCreateCard?: (listId: string) => void;
}

export function ListColumn({
  list,
  children,
  cardCount,
  onRename,
  onDelete,
  onReorderUp,
  onReorderDown,
  onCreateCard,
}: ListColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(list.titulo);

  async function handleSave() {
    if (titulo.trim() && titulo !== list.titulo) {
      await onRename(list.id, titulo);
    } else {
      setTitulo(list.titulo);
    }
    setIsEditing(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 min-w-75 flex flex-col max-h-[80vh]">
      <div className="flex justify-between items-center mb-3 px-1">
        {isEditing ? (
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={50}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setTitulo(list.titulo);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 text-sm"
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setIsEditing(true)}>
            <h3 className="font-semibold text-gray-900 cursor-pointer truncate">
              {titulo}
            </h3>
            {typeof cardCount === "number" && (
              <span className="text-xs text-gray-400 font-medium">{cardCount}</span>
            )}
          </div>
        )}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onReorderUp()}
            className="w-6 h-6 flex items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 rounded"
            title="Mover para esquerda"
          >
            ←
          </button>
          <button
            onClick={() => onReorderDown()}
            className="w-6 h-6 flex items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 rounded"
            title="Mover para direita"
          >
            →
          </button>
          <button
            onClick={() => onDelete(list.id)}
            className="w-6 h-6 flex items-center justify-center text-xs bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded"
            title="Deletar lista"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {children}
        {onCreateCard && (
          <button
            onClick={() => onCreateCard(list.id)}
            className="w-full mt-1 py-2 text-sm text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 rounded-lg transition"
          >
            + Adicionar card
          </button>
        )}
      </div>
    </div>
  );
}
