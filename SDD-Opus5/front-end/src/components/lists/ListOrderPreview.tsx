import type { PreviewItem } from "@/lib/listOrder";

/** Read-only preview of the resulting order; no dragging (spec 2.2, N61). */
export function ListOrderPreview({ items }: { items: PreviewItem[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-3">
      <p className="sr-only">Pré-visualização da ordem das listas</p>
      <ol className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.key}
            aria-current={item.highlighted ? "true" : undefined}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-[15px] ${
              item.highlighted ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line bg-white text-ink"
            }`}
          >
            <span aria-hidden="true" className="text-muted">
              =
            </span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item.name}</span>
            {item.highlighted ? <span className="sr-only">(posição da lista)</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
