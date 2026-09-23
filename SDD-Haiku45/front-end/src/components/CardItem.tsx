"use client";

import { useState } from "react";
import CardEditModal from "./CardEditModal";
import DeleteCardConfirmation from "./DeleteCardConfirmation";
import type { CardLabelInfo, CardAssigneeInfo, CardChecklistInfo } from "../hooks/useCards";

interface CardItemProps {
  id: string;
  listId: string;
  boardId: string;
  title: string;
  description: string | null;
  position: number;
  labels?: CardLabelInfo[];
  assignees?: CardAssigneeInfo[];
  checklist?: CardChecklistInfo | null;
  onUpdate: () => Promise<void>;
}

export default function CardItem({
  id,
  listId,
  boardId,
  title,
  description,
  labels = [],
  assignees = [],
  checklist = null,
  onUpdate,
}: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClose = async () => {
    setIsEditing(false);
    await onUpdate();
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(false);
    await onUpdate();
  };

  return (
    <>
      <div className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                    style={{ backgroundColor: label.color }}
                    title={label.name}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
            <h4 className="font-medium text-sm text-gray-900 truncate">{title}</h4>
            {description && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{description}</p>
            )}
            {(checklist || assignees.length > 0) && (
              <div className="flex items-center justify-between gap-2 mt-2">
                {checklist ? (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      checklist.total > 0 && checklist.completed === checklist.total
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    title="Checklist"
                  >
                    ☑ {checklist.completed}/{checklist.total}
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex -space-x-1">
                  {assignees.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
                      title={a.member_name}
                    >
                      {a.member_name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-blue-600 text-sm p-1"
              title="Edit"
            >
              ✎
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              className="text-gray-400 hover:text-red-600 text-sm p-1"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <CardEditModal
          cardId={id}
          listId={listId}
          boardId={boardId}
          initialTitle={title}
          initialDescription={description || ""}
          onClose={handleEditClose}
        />
      )}

      {isDeleting && (
        <DeleteCardConfirmation
          cardId={id}
          listId={listId}
          title={title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleting(false)}
        />
      )}
    </>
  );
}
