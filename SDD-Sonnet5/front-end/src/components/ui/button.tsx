import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-50",
  outline:
    "border border-border bg-surface text-foreground hover:bg-black/[.03] disabled:opacity-50",
  danger:
    "border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50",
  ghost: "text-foreground hover:bg-black/[.05] disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

export function IconButton({
  className,
  variant = "outline",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
