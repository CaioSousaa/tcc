import { useState, useCallback } from "react";

export interface CardLabelInfo {
  id: string;
  name: string;
  color: string;
}

export interface CardAssigneeInfo {
  id: string;
  member_name: string;
}

export interface CardChecklistInfo {
  total: number;
  completed: number;
}

interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  position: number;
  labels?: CardLabelInfo[];
  assignees?: CardAssigneeInfo[];
  checklist?: CardChecklistInfo | null;
}

interface UseCardsResult {
  cards: Card[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCards(listId: string): UseCardsResult {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!listId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lists/${listId}/cards`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setCards(data.cards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  return {
    cards,
    loading,
    error,
    refetch: fetchCards,
  };
}

export function useCreateCard(listId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCard = useCallback(
    async (title: string, description?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lists/${listId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create card";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listId]
  );

  return { createCard, loading, error };
}

export function useUpdateCard(listId: string, cardId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCard = useCallback(
    async (title?: string, description?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lists/${listId}/cards/${cardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update card";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listId, cardId]
  );

  return { updateCard, loading, error };
}

export function useDeleteCard(listId: string, cardId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lists/${listId}/cards/${cardId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP ${response.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete card";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listId, cardId]);

  return { deleteCard, loading, error };
}

export function useMoveCard(fromListId: string, cardId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moveCard = useCallback(
    async (toListId: string, position: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lists/${fromListId}/cards/${cardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ list_id: toListId, position }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to move card";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fromListId, cardId]
  );

  return { moveCard, loading, error };
}
