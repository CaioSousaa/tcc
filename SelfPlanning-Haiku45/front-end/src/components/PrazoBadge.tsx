interface PrazoBadgeProps {
  dataPrazo?: string;
}

export default function PrazoBadge({ dataPrazo }: PrazoBadgeProps) {
  if (!dataPrazo) return null;

  const prazo = new Date(dataPrazo);
  const agora = new Date();
  const diffMs = prazo.getTime() - agora.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dataFormatada = prazo.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");

  let bgColor = "bg-slate-100 text-slate-600";
  let texto = `Vence ${dataFormatada}`;

  if (diffDias < 0) {
    const dias = Math.abs(diffDias);
    bgColor = "bg-red-50 text-red-600";
    texto = `Atrasado há ${dias} dia${dias !== 1 ? "s" : ""}`;
  } else if (diffDias === 0) {
    bgColor = "bg-orange-50 text-orange-600";
    texto = "Vence hoje";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium ${bgColor}`}>
      ⏱ {texto}
    </span>
  );
}
