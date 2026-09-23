import { useState, useEffect } from "react";
import { getLabels, addCardLabel, removeCardLabel, getCardLabels } from "@/lib/api";
import LabelBadge from "./LabelBadge";

interface Label {
  id: string;
  nome: string;
  cor: string;
  dataCriacao: string;
}

interface CardLabelModalProps {
  boardId: string;
  listId: string;
  cardId: string;
  onClose: () => void;
}

export default function CardLabelModal({ boardId, listId, cardId, onClose }: CardLabelModalProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [cardLabels, setCardLabels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allLabelsRes, cardLabelsRes] = await Promise.all([
          getLabels(boardId),
          getCardLabels(boardId, listId, cardId),
        ]);
        setLabels(allLabelsRes.data);
        setCardLabels(new Set(cardLabelsRes.data.map((l: Label) => l.id)));
      } catch (err) {
        setError("Erro ao carregar etiquetas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [boardId, listId, cardId]);

  const handleToggleLabel = async (labelId: string, isAdded: boolean) => {
    try {
      if (isAdded) {
        await removeCardLabel(boardId, listId, cardId, labelId);
        setCardLabels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(labelId);
          return newSet;
        });
      } else {
        await addCardLabel(boardId, listId, cardId, labelId);
        setCardLabels((prev) => new Set(prev).add(labelId));
      }
    } catch (err) {
      setError("Erro ao atualizar etiqueta");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Etiquetas do Cartão</h3>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
          {labels.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma etiqueta no quadro</p>
          ) : (
            labels.map((label) => {
              const isAdded = cardLabels.has(label.id);
              return (
                <div key={label.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAdded}
                    onChange={() => handleToggleLabel(label.id, isAdded)}
                    className="h-4 w-4"
                  />
                  <LabelBadge nome={label.nome} cor={label.cor} />
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
