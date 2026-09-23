import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const CONTROL_CLASSES =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50";

export function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL_CLASSES} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL_CLASSES} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL_CLASSES} ${props.className ?? ""}`} />;
}
