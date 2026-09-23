import { useState, useEffect } from "react";
import { getLabels, createLabel, updateLabel, deleteLabel } from "@/lib/api";
import LabelBadge from "./LabelBadge";
import LabelPicker from "./LabelPicker";

interface Label {
  id: string;
  nome: string;
  cor: string;
  dataCriacao: string;
}

interface BoardLabelsProps {
  boardId: string;
  onClose: () => void;
}

export default function BoardLabels({ boardId, onClose }: BoardLabelsProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  useEffect(() => {
    loadLabels();
  }, [boardId]);

  const loadLabels = async () => {
    try {
      const res = await getLabels(boardId);
      setLabels(res.data);
    } catch (err) {
      setError("Erro ao carregar etiquetas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (nome: string, cor: string) => {
    try {
      if (editingLabel) {
        await updateLabel(boardId, editingLabel.id, nome, cor);
      } else {
        await createLabel(boardId, nome, cor);
      }
      setShowPicker(false);
      setEditingLabel(null);
      await loadLabels();
    } catch (err) {
      setError("Erro ao salvar etiqueta");
      console.error(err);
    }
  };

  const handleDelete = async (labelId: string) => {
    if (!confirm("Deletar etiqueta?")) return;
    try {
      await deleteLabel(boardId, labelId);
      await loadLabels();
    } catch (err) {
      setError("Erro ao deletar etiqueta");
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
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Etiquetas do Quadro</h3>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {labels.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma etiqueta criada</p>
          ) : (
            labels.map((label) => (
              <div key={label.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <LabelBadge nome={label.nome} cor={label.cor} />
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingLabel(label);
                      setShowPicker(true);
                    }}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(label.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 justify-between">
          <button
            onClick={() => {
              setEditingLabel(null);
              setShowPicker(true);
            }}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Nova Etiqueta
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            Fechar
          </button>
        </div>

        {showPicker && (
          <LabelPicker
            initialNome={editingLabel?.nome || ""}
            initialCor={editingLabel?.cor || "azul"}
            onSelect={handleCreateOrUpdate}
            onCancel={() => {
              setShowPicker(false);
              setEditingLabel(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
