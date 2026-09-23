"use client";

import { InputHTMLAttributes, useId } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        className="h-11 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-brand disabled:opacity-60"
        {...props}
      />
    </div>
  );
}
