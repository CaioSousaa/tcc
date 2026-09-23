import { useState, useEffect } from "react";

interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
}

interface DueFilterCounts {
  overdue: number;
  due_today: number;
  next_7_days: number;
  next_30_days: number;
  no_due: number;
}

interface DueFilterState {
  cards: Card[];
  filter: "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due";
  counts: DueFilterCounts;
  setFilter: (filter: "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due") => void;
  loading: boolean;
  error: string | null;
}

export function useDueFilter(boardId: string): DueFilterState {
  const [cards, setCards] = useState<Card[]>([]);
  const [filter, setFilter] = useState<"overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due">("no_due");
  const [counts, setCounts] = useState<DueFilterCounts>({
    overdue: 0,
    due_today: 0,
    next_7_days: 0,
    next_30_days: 0,
    no_due: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/boards/${boardId}/cards?filter=${filter}`);
        if (!response.ok) {
          throw new Error("Erro ao buscar cartões");
        }

        const data = await response.json();
        setCards(data.cards || []);

        // Fetch counts for all filters
        const overdue = await fetch(`/api/boards/${boardId}/cards?filter=overdue`).then((r) => r.json());
        const due_today = await fetch(`/api/boards/${boardId}/cards?filter=due_today`).then((r) => r.json());
        const next_7_days = await fetch(`/api/boards/${boardId}/cards?filter=next_7_days`).then((r) => r.json());
        const next_30_days = await fetch(`/api/boards/${boardId}/cards?filter=next_30_days`).then((r) => r.json());
        const no_due = await fetch(`/api/boards/${boardId}/cards?filter=no_due`).then((r) => r.json());

        setCounts({
          overdue: overdue.cards?.length || 0,
          due_today: due_today.cards?.length || 0,
          next_7_days: next_7_days.cards?.length || 0,
          next_30_days: next_30_days.cards?.length || 0,
          no_due: no_due.cards?.length || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [boardId, filter]);

  return {
    cards,
    filter,
    counts,
    setFilter,
    loading,
    error,
  };
}
