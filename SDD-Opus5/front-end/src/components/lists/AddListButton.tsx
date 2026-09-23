import { PlusIcon } from "@/components/boards/icons";

export function AddListButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-[320px] shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-muted/50 text-[15px] text-muted transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <PlusIcon />
      Adicionar lista
    </button>
  );
}
