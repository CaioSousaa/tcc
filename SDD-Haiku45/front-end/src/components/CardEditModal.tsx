"use client";

import { useState } from "react";
import { useUpdateCard } from "../hooks/useCards";
import { useMyRole } from "../hooks/useMyRole";
import { useAuth } from "../hooks/useAuth";
import { useCardLabels } from "../hooks/useCardLabels";
import { useCardLabelManagement } from "../hooks/useCardLabelManagement";
import LabelBadge from "./LabelBadge";
import LabelSelector from "./LabelSelector";
import { LabelsModal } from "./LabelsModal";
import { useDueDate } from "../hooks/useDueDate";
import { DueDateBadge } from "./DueDateBadge";
import { DueDatePicker } from "./DueDatePicker";
import { useAssignees } from "../hooks/useAssignees";
import AssigneeList from "./AssigneeList";
import AssigneeSelector from "./AssigneeSelector";
import CommentSection from "./CommentSection";
import ChecklistSection from "./ChecklistSection";

interface CardEditModalProps {
  cardId: string;
  listId: string;
  boardId: string;
  initialTitle: string;
  initialDescription: string;
  onClose: () => Promise<void>;
}

export default function CardEditModal({
  cardId,
  listId,
  boardId,
  initialTitle,
  initialDescription,
  onClose,
}: CardEditModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const { updateCard } = useUpdateCard(listId, cardId);
  const { hasRole, role } = useMyRole(boardId);
  const { dueDate, refetch: refetchDueDate } = useDueDate(listId, cardId);

  const { user } = useAuth();
  const currentUserId = user?.id ?? "";

  const { labels: cardLabels, refetch: refetchCardLabels } = useCardLabels(cardId);
  const { removeLabel } = useCardLabelManagement(boardId, cardId);
  const {
    assignees,
    loading: assigneesLoading,
    error: assigneesError,
    addAssignee,
    removeAssignee,
  } = useAssignees(cardId, boardId);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [labelsVersion, setLabelsVersion] = useState(0);

  const handleRemoveLabel = async (cardLabelId: string) => {
    try {
      await removeLabel(cardLabelId);
      await refetchCardLabels();
    } catch {
      // erro exposto pelo hook
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Título não pode estar vazio");
      return;
    }

    if (title.length > 255) {
      setError("Título muito longo (máximo 255 caracteres)");
      return;
    }

    if (description.length > 5000) {
      setError("Descrição muito longa (máximo 5000 caracteres)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateCard(title, description);
      await onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl my-8 flex flex-col max-h-screen">
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">CARD · EM PROGRESSO</span>
            <h2 className="text-2xl font-semibold mt-2">{title}</h2>
          </div>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Descrição</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 resize-none"
                  rows={4}
                  placeholder="Escreva uma descrição"
                  maxLength={5000}
                />
              </div>

              <div>
                <ChecklistSection cardId={cardId} boardId={boardId} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Comentários</h3>
                <CommentSection
                  cardId={cardId}
                  boardId={boardId}
                  currentUserId={currentUserId}
                  userRole={(role as "admin" | "editor" | "viewer") || "viewer"}
                />
              </div>
            </div>

            <div className="col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Lista</h3>
                <div className="p-3 bg-gray-50 rounded text-sm">{listId}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Etiquetas</h3>
                <div className="space-y-2">
                  {cardLabels.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhuma etiqueta aplicada</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {cardLabels.map((label) => (
                      <LabelBadge
                        key={label.card_label_id}
                        name={label.name}
                        color={label.color}
                        readonly={!(hasRole("editor") || hasRole("admin"))}
                        onRemove={() => handleRemoveLabel(label.card_label_id)}
                      />
                    ))}
                  </div>
                  <LabelSelector
                    key={labelsVersion}
                    boardId={boardId}
                    cardId={cardId}
                    canEdit={hasRole("editor") || hasRole("admin")}
                    excludeIds={cardLabels.map((l) => l.id)}
                    onApply={refetchCardLabels}
                  />
                  {hasRole("admin") && (
                    <button
                      onClick={() => setShowLabelsModal(true)}
                      className="w-full px-3 py-2 text-left text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Gerenciar etiquetas
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Responsáveis</h3>
                <AssigneeList
                  assignees={assignees}
                  error={assigneesError}
                  loading={assigneesLoading}
                  onRemove={removeAssignee}
                />
                {(hasRole("editor") || hasRole("admin")) && (
                  <div className="mt-3">
                    <AssigneeSelector
                      boardId={boardId}
                      onSelect={addAssignee}
                      selectedIds={assignees.map((a) => a.member_id)}
                      loading={assigneesLoading}
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Prazo</h3>
                <div className="mb-3">
                  <DueDateBadge dueDate={dueDate} />
                </div>
                {(hasRole("editor") || hasRole("admin")) && (
                  <>
                    {!showDueDatePicker && (
                      <button
                        onClick={() => setShowDueDatePicker(true)}
                        className="w-full px-3 py-2 text-sm bg-blue-950 text-white rounded hover:bg-blue-900"
                      >
                        {dueDate ? "Editar prazo" : "Definir prazo"}
                      </button>
                    )}
                    {showDueDatePicker && (
                      <DueDatePicker
                        cardId={cardId}
                        boardId={boardId}
                        currentDueDate={dueDate}
                        onSave={async () => {
                          await refetchDueDate();
                          setShowDueDatePicker(false);
                        }}
                        onCancel={() => setShowDueDatePicker(false)}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded mx-6">
              {error}
            </div>
          )}
        </div>

        <div className="border-t p-6 flex gap-2 justify-end">
          <button
            onClick={() => onClose()}
            disabled={isSaving}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 text-white bg-blue-950 rounded hover:bg-blue-900 disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar card"}
          </button>
          <button className="px-6 py-2 text-red-600 hover:text-red-700 font-medium">
            Excluir card
          </button>
        </div>
      </div>

      {showLabelsModal && (
        <LabelsModal
          boardId={boardId}
          onClose={() => {
            setShowLabelsModal(false);
            setLabelsVersion((v) => v + 1);
            refetchCardLabels();
          }}
        />
      )}
    </div>
  );
}
