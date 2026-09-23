"use client";

import { useRef, type KeyboardEvent } from "react";
import { BOARD_COLOR_OPTIONS, type BoardColor } from "@/lib/boardColors";

type Props = {
  value: BoardColor;
  onChange: (color: BoardColor) => void;
  disabled?: boolean;
  error?: string | undefined;
};

/** Keyboard-operable radio group; each swatch has a text label (N39). */
export function ColorPicker({ value, onChange, disabled = false, error }: Props) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const current = BOARD_COLOR_OPTIONS.findIndex((option) => option.key === value);
    const next = (current + step + BOARD_COLOR_OPTIONS.length) % BOARD_COLOR_OPTIONS.length;
    const option = BOARD_COLOR_OPTIONS[next];
    if (!option) return;
    onChange(option.key);
    buttonsRef.current[next]?.focus();
  }

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-3 text-sm font-medium text-ink">Cor</legend>
      <div role="radiogroup" aria-label="Cor do quadro" onKeyDown={move} className="flex gap-3">
        {BOARD_COLOR_OPTIONS.map((option, index) => {
          const selected = option.key === value;
          return (
            <button
              key={option.key}
              ref={(element) => {
                buttonsRef.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.key)}
              className={`h-9 w-9 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                selected ? "ring-2 ring-ink ring-offset-2" : "hover:scale-105"
              }`}
              style={{ backgroundColor: option.hex }}
            />
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
