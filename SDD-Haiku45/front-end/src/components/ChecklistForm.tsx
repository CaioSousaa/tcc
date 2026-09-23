"use client";

import React, { useState } from "react";

interface ChecklistFormProps {
  onAddItem: (title: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function ChecklistForm({
  onAddItem,
  loading = false,
  error,
}: ChecklistFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      await onAddItem(title.trim());
      setTitle("");
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Adicionar novo item..."
          maxLength={500}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
