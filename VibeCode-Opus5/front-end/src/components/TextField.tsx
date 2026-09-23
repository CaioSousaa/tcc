"use client";

import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

export function TextField({ label, error, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name ?? label;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm text-foreground">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/15 ${
          error ? "border-danger" : "border-line"
        }`}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
