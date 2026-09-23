import { useId } from "react";
import type { BoardListItem } from "@/services/boardService";

type Props = {
  lists: readonly BoardListItem[];
  listId: string;
  position: number;
  positionOptions: number[];
  onListChange: (listId: string) => void;
  onPositionChange: (position: number) => void;
  disabled?: boolean;
  positionError?: string | undefined;
};

const selectClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

/** "Lista" and "Posição na lista" selectors of the card dialog (spec 2.3, F45). */
export function CardLocationFields({
  lists,
  listId,
  position,
  positionOptions,
  onListChange,
  onPositionChange,
  disabled = false,
  positionError,
}: Props) {
  const listSelectId = useId();
  const positionSelectId = useId();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor={listSelectId} className="text-sm font-medium text-ink">
          Lista
        </label>
        <select
          id={listSelectId}
          value={listId}
          disabled={disabled}
          onChange={(event) => onListChange(event.target.value)}
          className={selectClass}
        >
          {[...lists]
            .sort((a, b) => a.position - b.position)
            .map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={positionSelectId} className="text-sm font-medium text-ink">
          Posição na lista
        </label>
        <select
          id={positionSelectId}
          value={position}
          disabled={disabled}
          aria-invalid={positionError ? true : undefined}
          onChange={(event) => onPositionChange(Number(event.target.value))}
          className={selectClass}
        >
          {positionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {positionError ? (
          <p role="alert" className="text-sm text-danger">
            {positionError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
