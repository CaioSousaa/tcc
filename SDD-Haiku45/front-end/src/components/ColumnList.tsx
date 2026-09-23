"use client";

import { useEffect, useState } from "react";
import { useColumns, useCreateColumn, useUpdateColumn, useDeleteColumn } from "../hooks/useColumns";
import { AddColumnButton } from "./AddColumnButton";
import { ColumnHeader } from "./ColumnHeader";
import { DueDateFilter } from "./DueDateFilter";
import CardList from "./CardList";
import { ConfirmModal } from "./ConfirmModal";

interface ColumnListProps {
  boardId: string;
  selectedLabelIds?: string[];
  refreshToken?: number;
}

interface Column {
  id: string;
  name: string;
  position: number;
  card_count: number;
}

export function ColumnList({ boardId, selectedLabelIds = [], refreshToken = 0 }: ColumnListProps) {
  const { columns, fetchColumns, loading: loadingColumns, error: columnsError } = useColumns(boardId);
  const { create, loading: creatingColumn, error: createError } = useCreateColumn(boardId);
  const { update: updateColumn } = useUpdateColumn(boardId);
  const { deleteColumn } = useDeleteColumn(boardId);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [cardCountByColumn, setCardCountByColumn] = useState<Record<string, number>>({});
  const [dueFilter, setDueFilter] = useState<"overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due">("no_due");

  useEffect(() => {
    fetchColumns();
  }, [boardId]);

  const getCardCountForColumn = (columnId: string): number => {
    // Inicialmente retorna 0, será atualizado via CardList notification
    return cardCountByColumn[columnId] || 0;
  };

  const handleAddColumn = async (name: string) => {
    try {
      await create(name);
      await fetchColumns();
      setNewColumnName("");
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleRenameColumn = async (columnId: string, newName: string) => {
    try {
      await updateColumn(columnId, newName);
      setEditingColumnId(null);
      await fetchColumns();
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteColumn(columnId);
      setShowDeleteConfirm(null);
      await fetchColumns();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao deletar lista");
    } finally {
      setDeleting(false);
    }
  };

  const columnToDelete = columns.find((c) => c.id === showDeleteConfirm);

  if (loadingColumns) {
    return <div className="text-center py-8">Carregando listas...</div>;
  }

  if (columnsError) {
    return <div className="text-center py-8 text-red-600">{columnsError}</div>;
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <ColumnHeader
            column={{ ...column, card_count: cardCountByColumn[column.id] ?? column.card_count }}
            isEditing={editingColumnId === column.id}
            onEditClick={() => setEditingColumnId(column.id)}
            onRename={(newName) => handleRenameColumn(column.id, newName)}
            onRenameCancel={() => setEditingColumnId(null)}
            onDelete={() => {
              setDeleteError(null);
              setShowDeleteConfirm(column.id);
            }}
          />

          <div className="mt-4">
            <CardList
              listId={column.id}
              boardId={boardId}
              listName={column.name}
              selectedLabelIds={selectedLabelIds}
              refreshToken={refreshToken}
              onCardCountChange={(count) => {
                setCardCountByColumn(prev => ({
                  ...prev,
                  [column.id]: count
                }));
              }}
            />
          </div>
        </div>
      ))}

        <AddColumnButton
          boardId={boardId}
          onAdd={handleAddColumn}
          loading={creatingColumn}
          error={createError}
        />
      </div>

      {columnToDelete && (
        <ConfirmModal
          title="Deletar lista?"
          message={
            <>
              Tem certeza que deseja deletar "{columnToDelete.name}"? Esta ação é irreversível.
              {getCardCountForColumn(columnToDelete.id) > 0 && (
                <strong className="block mt-1">
                  Todos os {getCardCountForColumn(columnToDelete.id)} cartão
                  {getCardCountForColumn(columnToDelete.id) !== 1 ? "s" : ""} nesta lista também serão deletados.
                </strong>
              )}
            </>
          }
          loading={deleting}
          error={deleteError}
          onConfirm={() => handleDeleteColumn(columnToDelete.id)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
