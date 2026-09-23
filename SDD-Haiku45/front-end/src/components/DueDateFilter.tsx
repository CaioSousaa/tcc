"use client";

import React from "react";
import { useDueFilter } from "@/hooks/useDueFilter";

interface DueDateFilterProps {
  boardId: string;
  onFilterChange?: (filter: "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due") => void;
}

export function DueDateFilter({ boardId, onFilterChange }: DueDateFilterProps) {
  const { filter, counts, setFilter, loading } = useDueFilter(boardId);

  const handleFilterChange = (newFilter: "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due") => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  const filters = [
    { key: "overdue", label: "Atrasados", count: counts.overdue },
    { key: "due_today", label: "Vencendo hoje", count: counts.due_today },
    { key: "next_7_days", label: "Próximos 7 dias", count: counts.next_7_days },
    { key: "next_30_days", label: "Próximos 30 dias", count: counts.next_30_days },
    { key: "no_due", label: "Sem prazo", count: counts.no_due },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => handleFilterChange(key)}
          disabled={loading}
          className={`px-3 py-2 rounded border ${
            filter === key
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-black border-gray-300"
          } disabled:opacity-50`}
        >
          {label} ({count})
        </button>
      ))}
    </div>
  );
}
