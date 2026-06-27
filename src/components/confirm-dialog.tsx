"use client";

import { useRef } from "react";
import { Dialog } from "./dialog";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

type Props = {
  request: ConfirmRequest | null;
  onClose: () => void;
};

/**
 * Accessible replacement for window.confirm(). Renders as an `alertdialog`
 * (destructive confirmation with no further input), describes the consequence
 * via aria-describedby, and places initial focus on Cancel — the safe action.
 */
export function ConfirmDialog({ request, onClose }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={request != null}
      onClose={onClose}
      role="alertdialog"
      titleId="confirm-title"
      describedById="confirm-message"
      title={request?.title ?? ""}
      maxWidth="max-w-sm"
      initialFocusRef={cancelRef}
    >
      <div className="p-5 space-y-4">
        <p id="confirm-message" className="text-sm text-(--foreground)">
          {request?.message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded hover:bg-(--surface-2)"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              request?.onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 text-sm rounded hover:opacity-90 ${
              request?.destructive
                ? "bg-(--danger) text-(--danger-fg)"
                : "bg-(--accent) text-(--accent-fg)"
            }`}
          >
            {request?.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
