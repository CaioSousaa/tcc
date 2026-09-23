"use client";

import { useId, type KeyboardEvent } from "react";
import { LABEL_COLOR_OPTIONS, type LabelColor } from "@/lib/labelColors";

type Props = {
  value: LabelColor;
  onChange: (color: LabelColor) => void;
  disabled?: boolean;
  error?: string | undefined;
};

/** Radio group with the 6 colors, named for assistive technology (RF08 N176). */
export function LabelColorPicker({ value, onChange, disabled = false, error }: Props) {
  const labelId = useId();
  const index = LABEL_COLOR_OPTIONS.findIndex((option) => option.key === value);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (step === 0 || disabled) return;
    event.preventDefault();
    const next = LABEL_COLOR_OPTIONS[(index + step + LABEL_COLOR_OPTIONS.length) % LABEL_COLOR_OPTIONS.length];
    if (next) {
      onChange(next.key);
      const button = event.currentTarget.querySelector<HTMLButtonElement>(`[data-color="${next.key}"]`);
      button?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span id={labelId} className="sr-only">
        Cor
      </span>
      <div role="radiogroup" aria-labelledby={labelId} onKeyDown={handleKeyDown} className="flex flex-wrap gap-2">
        {LABEL_COLOR_OPTIONS.map((option) => {
          const selected = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              data-color={option.key}
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.key)}
              className={`h-8 w-8 rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60 ${
                selected ? "ring-2 ring-ink ring-offset-2" : ""
              }`}
              style={{ backgroundColor: option.swatch }}
            >
              {selected ? (
                <span aria-hidden="true" className="text-sm font-bold text-white">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
