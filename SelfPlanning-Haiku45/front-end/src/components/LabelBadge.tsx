interface LabelBadgeProps {
  nome: string;
  cor: string;
}

const colorMap: Record<string, string> = {
  vermelho: "bg-red-100 text-red-700",
  azul: "bg-blue-100 text-blue-700",
  verde: "bg-emerald-100 text-emerald-700",
  amarelo: "bg-yellow-100 text-yellow-700",
  roxo: "bg-purple-100 text-purple-700",
  rosa: "bg-pink-100 text-pink-700",
  laranja: "bg-orange-100 text-orange-700",
  cinza: "bg-gray-100 text-gray-700",
};

export default function LabelBadge({ nome, cor }: LabelBadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colorMap[cor] || colorMap.cinza}`}>
      {nome}
    </span>
  );
}
