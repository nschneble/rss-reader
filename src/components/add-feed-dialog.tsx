"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
};

export function AddFeedDialog({ open, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setUrl("");
    setError(null);
    setBusy(false);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-feed-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-(--background) text-(--foreground) rounded-lg shadow-lg border border-(--border)">
        <div className="flex items-center justify-between px-5 py-3 border-b border-(--border)">
          <h2 id="add-feed-title" className="text-base font-semibold">
            Add a feed
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-(--surface-2)"
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="feed-url"
              className="block text-sm font-medium mb-1"
            >
              Feed URL
            </label>
            <input
              ref={inputRef}
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
      </div>
    </div>
  );
}
