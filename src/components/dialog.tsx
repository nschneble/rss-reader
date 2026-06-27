"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { CloseIcon } from "./icons";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  role?: "dialog" | "alertdialog";
  describedById?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function Dialog({
  open,
  onClose,
  titleId,
  title,
  children,
  maxWidth = "max-w-md",
  role = "dialog",
  describedById,
  initialFocusRef,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  // Keep the latest onClose in a ref so the focus-trap effect can depend only
  // on `open`. Including `onClose` (often a fresh inline closure each render)
  // would re-run the effect on every parent re-render, and its cleanup would
  // restore focus to the trigger while the dialog is still open.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    previousActive.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const target = initialFocusRef?.current ?? focusables?.[0];
    const raf = requestAnimationFrame(() => target?.focus());

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialog) {
        const items = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && active === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    // Cleanup runs only when `open` flips to false (or unmount) — i.e. an actual
    // close — so focus returns to the trigger exactly once.
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      previousActive.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        className={`w-full ${maxWidth} bg-(--background) text-(--foreground) rounded-lg shadow-lg border border-(--border)`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-(--border)">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-(--surface-2)"
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
