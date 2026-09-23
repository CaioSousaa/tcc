"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** While true, Esc, backdrop clicks and native closing are ignored (RF02 F17). */
  busy?: boolean;
  /** "lg" for the card dialog (RF04 N83). */
  size?: "md" | "lg";
  /** Small caption above the title, e.g. "CARD · A fazer". */
  eyebrow?: string;
  children: ReactNode;
};

const FOCUSABLE_FIELD = "input:not([disabled]), select:not([disabled]), textarea:not([disabled])";

/**
 * Accessible modal on the native <dialog>: focus trap, Esc and backdrop come
 * from the platform (RF02 T1, N38). Focus returns to the opener on close.
 */
export function Modal({ open, title, onClose, busy = false, size = "md", eyebrow, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const closingRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      // React's autoFocus runs before showModal() and is lost; focus explicitly (RF03 F33, RF02 D1).
      const target = dialog.querySelector<HTMLElement>("[data-autofocus]") ?? dialog.querySelector<HTMLElement>(FOCUSABLE_FIELD);
      target?.focus();
    } else if (!open && dialog.open) {
      closingRef.current = true;
      dialog.close();
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    }
  }, [open]);

  // Parents usually unmount the modal instead of toggling `open`: close it and restore focus too.
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = openerRef;
    const closing = closingRef;
    return () => {
      if (dialog?.open) {
        closing.current = true;
        dialog.close();
      }
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
    };
  }, []);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Esc: the dialog state is owned by React.
    event.preventDefault();
    if (!busy) onClose();
  }

  /**
   * The browser may close the dialog without a cancelable event (e.g. repeated
   * Esc in Chromium). Keep React and the DOM in sync (RF03 F33, RF02 D2).
   */
  function handleNativeClose() {
    const dialog = dialogRef.current;
    if (closingRef.current || !dialog) {
      closingRef.current = false;
      return;
    }
    if (busy) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    onClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current && !busy) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl bg-transparent p-0 text-ink backdrop:bg-ink/50 ${
        size === "lg" ? "max-w-[836px]" : "max-w-[462px]"
      }`}
    >
      {open ? (
        <div className="rounded-2xl bg-white p-7 shadow-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">{eyebrow}</p>
              ) : null}
              <h2 id={titleId} className="break-words text-xl font-bold [overflow-wrap:anywhere]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              disabled={busy}
              aria-label="Fechar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-muted transition hover:bg-surface disabled:opacity-50"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
