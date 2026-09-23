import { PlusIcon } from "@/components/boards/icons";

export function AddCardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-muted/50 text-[15px] text-muted transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <PlusIcon />
      Adicionar card
    </button>
  );
}
