"use client";

import { createBoard } from "@/lib/api";
import { FormEvent, useState } from "react";

const BOARD_COLORS = [
  { name: "Navy", value: "blue-950", hex: "#1f3a5f" },
  { name: "Blue", value: "blue-500", hex: "#3b82f6" },
  { name: "Green", value: "green-500", hex: "#22c55e" },
  { name: "Orange", value: "amber-500", hex: "#f59e0b" },
  { name: "Purple", value: "purple-500", hex: "#9333ea" },
];

interface Board {
  id: string;
  titulo: string;
  descricao?: string;
  corFundo: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (board: Board) => void;
}

export function NewBoardModal({ isOpen, onClose, onCreated }: NewBoardModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0].hex);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setSelectedColor(BOARD_COLORS[0].hex);
    setError("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      setError("Título é obrigatório");
      return;
    }

    if (titulo.length > 100) {
      setError("Título deve ter no máximo 100 caracteres");
      return;
    }

    setLoading(true);
    try {
      const resp = await createBoard(titulo, descricao || undefined, selectedColor);
      onCreated(resp.data);
      resetForm();
    } catch (err) {
      setError("Erro ao criar quadro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Novo quadro</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Nome do quadro</label>
            <input
              type="text"
              placeholder="Ex. Sprint 13"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Cor</label>
            <div className="flex gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-10 h-10 rounded-lg transition-all border-2 ${
                    selectedColor === color.hex
                      ? "border-gray-800 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
            <textarea
              placeholder="Descrição do quadro"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:bg-gray-400"
            >
              {loading ? "Criando..." : "Criar quadro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
