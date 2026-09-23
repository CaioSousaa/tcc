"use client";

import { useState } from "react";
import { useLabels } from "@/hooks/useLabels";
import { useLabelManagement } from "@/hooks/useLabelManagement";
import LabelBadge from "./LabelBadge";

interface LabelManagerProps {
  boardId: string;
}

export default function LabelManager({ boardId }: LabelManagerProps) {
  const { labels, loading, error: loadError, refetch } = useLabels(boardId);
  const {
    createLabel,
    updateLabel,
    deleteLabel,
    loading: actionLoading,
    error: actionError,
    clearError,
  } = useLabelManagement(boardId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#FF0000");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingLabelId(null);
    setFormName("");
    setFormColor("#FF0000");
    clearError();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (label: any) => {
    setEditingLabelId(label.id);
    setFormName(label.name);
    setFormColor(label.color);
    clearError();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingLabelId) {
        await updateLabel(editingLabelId, formName, formColor);
      } else {
        await createLabel(formName, formColor);
      }
      setIsModalOpen(false);
      await refetch();
    } catch (err) {
      console.error("Falha ao salvar etiqueta", err);
    }
  };

  const handleDelete = async (labelId: string) => {
    try {
      await deleteLabel(labelId);
      setDeleteConfirmId(null);
      await refetch();
    } catch (err) {
      console.error("Falha ao deletar etiqueta", err);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando etiquetas...</div>;
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {loadError}
        </div>
      )}

      <button
        onClick={handleOpenCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Nova Etiqueta
      </button>

      <div className="space-y-2">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
          >
            <div className="flex items-center gap-3">
              <LabelBadge
                name={label.name}
                color={label.color}
                readonly={true}
              />
              <span className="text-xs text-gray-500">
                ({label.card_count} cartões)
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleOpenEdit(label)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
              >
                Editar
              </button>

              <button
                onClick={() => setDeleteConfirmId(label.id)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
              >
                Deletar
              </button>

              {deleteConfirmId === label.id && (
                <div className="absolute bg-white border border-gray-300 rounded shadow p-3 z-10">
                  <p className="text-sm mb-2">
                    Deletar etiqueta "{label.name}"?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(label.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      disabled={actionLoading}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
          <div className="bg-white rounded shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">
              {editingLabelId ? "Editar Etiqueta" : "Nova Etiqueta"}
            </h2>

            {actionError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm mb-4">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Bug, Feature, Urgent"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="#FF0000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={actionLoading || !formName}
              >
                {editingLabelId ? "Salvar" : "Criar"}
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
