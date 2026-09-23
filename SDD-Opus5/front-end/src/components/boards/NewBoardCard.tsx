export function NewBoardCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[188px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted/40 bg-transparent text-[15px] text-muted transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        +
      </span>
      Criar quadro
    </button>
  );
}
