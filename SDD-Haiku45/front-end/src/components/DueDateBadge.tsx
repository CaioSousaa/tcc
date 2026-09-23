"use client";

import React from "react";

interface DueDateBadgeProps {
  dueDate: string | null;
}

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  if (!dueDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);

  const diffTime = dueDay.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let status: "overdue" | "due_today" | "due_soon" | "no_due";
  let text: string;
  let color: string;

  if (diffDays < 0) {
    status = "overdue";
    text = `Atrasado desde ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "dia" : "dias"}`;
    color = "bg-red-500 text-white";
  } else if (diffDays === 0) {
    status = "due_today";
    text = "Vence hoje";
    color = "bg-orange-500 text-white";
  } else if (diffDays <= 7) {
    status = "due_soon";
    text = `Vence em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
    color = "bg-yellow-500 text-black";
  } else {
    status = "no_due";
    text = `Vence em ${diffDays} dias`;
    color = "bg-gray-300 text-black";
  }

  const formattedDate = new Date(dueDate).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`} title={formattedDate}>
      {text}
    </span>
  );
}
