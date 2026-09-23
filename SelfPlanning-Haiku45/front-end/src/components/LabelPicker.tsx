import { useState } from "react";

interface LabelPickerProps {
  onSelect: (nome: string, cor: string) => void;
  onCancel: () => void;
  initialNome?: string;
  initialCor?: string;
}

const COLORS = ["vermelho", "azul", "verde", "amarelo", "roxo", "rosa", "laranja", "cinza"];

const colorMap: Record<string, string> = {
  vermelho: "bg-red-500",
  azul: "bg-blue-500",
  verde: "bg-green-500",
  amarelo: "bg-yellow-400",
  roxo: "bg-purple-500",
  rosa: "bg-pink-500",
  laranja: "bg-orange-500",
  cinza: "bg-gray-500",
};

export default function LabelPicker({ onSelect, onCancel, initialNome = "", initialCor = "azul" }: LabelPickerProps) {
  const [nome, setNome] = useState(initialNome);
  const [cor, setCor] = useState(initialCor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length > 0) {
      onSelect(nome.trim(), cor);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">Criar/Editar Etiqueta</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={30}
              placeholder="Nome da etiqueta"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-8 h-8 rounded-full ${colorMap[c]} ${
                    cor === c ? "ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
