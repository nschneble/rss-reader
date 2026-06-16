"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
};

export function AddFeedDialog({ open, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl("");
    setError(null);
    setBusy(false);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      titleId="add-feed-title"
      title="Add a feed"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label
            htmlFor="feed-url"
            className="block text-sm font-medium mb-1"
          >
            Feed URL
          </label>
          <input
            id="feed-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/rss.xml"
            required
            autoComplete="off"
            className="w-full px-3 py-2 rounded border border-(--border) bg-(--surface) focus:border-(--accent) outline-none"
          />
          <p className="text-xs text-(--muted) mt-1">
            Paste an RSS or Atom feed URL.
          </p>
        </div>
        {error && (
          <p
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
            disabled={busy || !url.trim()}
            className="px-3 py-1.5 text-sm rounded bg-(--accent) text-(--accent-fg) hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add feed"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
