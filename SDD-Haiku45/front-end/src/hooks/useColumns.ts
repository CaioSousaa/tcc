"use client";

import { useState } from "react";

interface Column {
  id: string;
  name: string;
  position: number;
  card_count: number;
}

interface ColumnResponse {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at?: string;
}

export function useColumns(boardId: string) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColumns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao carregar listas");
      }

      const data = await response.json();
      setColumns(data.columns);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { columns, fetchColumns, loading, error };
}

export function useCreateColumn(boardId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (name: string): Promise<ColumnResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!name || name.trim().length === 0) {
        throw new Error("Nome não pode estar vazio");
      }

      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao criar lista");
      }

      const data: ColumnResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateColumn(boardId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (columnId: string, name?: string, position?: number): Promise<ColumnResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const body: Record<string, any> = {};
      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          throw new Error("Nome não pode estar vazio");
        }
        body.name = name;
      }
      if (position !== undefined) {
        body.position = position;
      }

      if (Object.keys(body).length === 0) {
        throw new Error("Forneça nome ou posição");
      }

      const response = await fetch(`/api/boards/${boardId}/columns/${columnId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar lista");
      }

      const data: ColumnResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useDeleteColumn(boardId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteColumn = async (columnId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/boards/${boardId}/columns/${columnId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao deletar lista");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteColumn, loading, error };
}
