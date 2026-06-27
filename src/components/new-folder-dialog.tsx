"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export function NewFolderDialog({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
    setBusy(false);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      titleId="new-folder-title"
      title="New folder"
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label htmlFor="folder-name" className="block text-sm font-medium mb-1">
            Folder name
          </label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "folder-name-error" : undefined}
            className="w-full px-3 py-2 rounded border border-(--border) bg-(--surface) focus:border-(--accent) outline-none"
          />
        </div>
        {error && (
          <p
            id="folder-name-error"
            role="alert"
            className="text-sm text-(--danger) bg-(--danger)/10 px-3 py-2 rounded"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded hover:bg-(--surface-2)"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="px-3 py-1.5 text-sm rounded bg-(--accent) text-(--accent-fg) hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
