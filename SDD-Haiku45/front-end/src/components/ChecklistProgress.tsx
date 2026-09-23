"use client";

import React from "react";

interface ChecklistProgressProps {
  completed: number;
  total: number;
  percentage: number;
}

export default function ChecklistProgress({
  completed,
  total,
  percentage,
}: ChecklistProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">
          Progresso: {completed} de {total}
        </span>
        <span className="text-gray-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
