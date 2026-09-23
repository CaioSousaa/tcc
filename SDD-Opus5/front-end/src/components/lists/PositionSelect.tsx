import { useId } from "react";

type Props = {
  options: number[];
  value: number;
  onChange: (position: number) => void;
  disabled?: boolean;
  error?: string | undefined;
};

/** Native select labelled "Posição no quadro" (plan T4, N60). */
export function PositionSelect({ options, value, onChange, disabled = false, error }: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        Posição no quadro
      </label>
      <select
        id={id}
        name="position"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-12 rounded-lg border bg-surface px-4 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 ${
          error ? "border-danger" : "border-line"
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
