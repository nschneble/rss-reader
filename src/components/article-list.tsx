"use client";

import type { ArticleListDTO } from "@/lib/api-client";
import {
  CheckIcon,
  RefreshIcon,
  SearchIcon,
  StarIcon,
  ArrowLeftIcon,
} from "./icons";

type Props = {
  title: string;
  articles: ArticleListDTO[];
  selectedId: number | null;
  showUnreadOnly: boolean;
  search: string;
  onSelect: (id: number) => void;
  onToggleStar: (id: number, next: boolean) => void;
  onToggleRead: (id: number, next: boolean) => void;
  onSearchChange: (q: string) => void;
  onToggleUnreadOnly: () => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  onBack?: () => void;
  refreshing: boolean;
  loading: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function ArticleList({
  title,
  articles,
  selectedId,
  showUnreadOnly,
  search,
  onSelect,
  onToggleStar,
  onToggleRead,
  onSearchChange,
  onToggleUnreadOnly,
  onMarkAllRead,
  onRefresh,
  onBack,
  refreshing,
  loading,
}: Props) {
  return (
    <section
      className="flex h-full flex-col bg-(--background) border-r border-(--border)"
      aria-label="Article list"
    >
      <div className="border-b border-(--border) px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded hover:bg-(--surface-2) lg:hidden"
              aria-label="Back to feeds"
            >
              <ArrowLeftIcon size={16} />
            </button>
          )}
          <h2 className="flex-1 text-base font-semibold tracking-tight truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded hover:bg-(--surface-2) disabled:opacity-50"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshIcon
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="p-1.5 rounded hover:bg-(--surface-2)"
            aria-label="Mark all read"
            title="Mark all read"
          >
            <CheckIcon size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-(--muted) pointer-events-none">
              <SearchIcon size={14} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search articles…"
              aria-label="Search articles"
              className="w-full pl-7 pr-2 py-1.5 text-sm rounded bg-(--surface) border border-(--border) focus:border-(--accent) outline-none"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-(--muted) cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={onToggleUnreadOnly}
              className="rounded"
            />
            Unread only
          </label>
        </div>
      </div>

      <ul
        className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-(--border)"
        aria-busy={loading || undefined}
      >
        {articles.length === 0 && !loading && (
          <li className="px-4 py-12 text-center text-sm text-(--muted)">
            {search
              ? "No matching articles."
              : showUnreadOnly
                ? "All caught up. ✓"
                : "No articles yet."}
          </li>
        )}
        {articles.map((a) => {
          const selected = a.id === selectedId;
          const dateLabel = formatDate(a.publishedAt);
          return (
            <li
              key={a.id}
              className={`group flex gap-1 ${
                selected ? "bg-(--selected) text-(--selected-fg)" : ""
              } ${a.isRead ? "opacity-70" : ""} hover:bg-(--surface)`}
            >
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="flex flex-1 gap-3 px-4 py-3 text-left min-w-0"
                aria-current={selected ? "page" : undefined}
              >
                <span className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      a.isRead ? "bg-transparent" : "bg-(--accent)"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">
                    {a.isRead ? "Read." : "Unread."}
                  </span>
                </span>
                <span className="flex-1 min-w-0 block">
                  <span className="flex items-baseline gap-2">
                    <span className="text-xs text-(--muted) truncate">
                      {a.feedTitle}
                    </span>
                    {dateLabel && (
                      <span className="text-xs text-(--muted) shrink-0">
                        {dateLabel}
                      </span>
                    )}
                  </span>
                  <span
                    className={`block text-sm leading-snug mt-0.5 ${
                      a.isRead ? "font-normal" : "font-semibold"
                    }`}
                  >
                    {a.title}
                  </span>
                  {a.summary && (
                    <span className="block text-xs text-(--muted) mt-1 line-clamp-2">
                      {a.summary}
                    </span>
                  )}
                </span>
              </button>
              <div
                role="group"
                aria-label={`Actions for ${a.title}`}
                className="flex flex-col gap-1 shrink-0 py-3 pr-3"
              >
                <button
                  type="button"
                  onClick={() => onToggleStar(a.id, !a.isStarred)}
                  className={`min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2) ${
                    a.isStarred ? "text-amber-500" : "text-(--muted)"
                  }`}
                  aria-label={a.isStarred ? "Unstar article" : "Star article"}
                  aria-pressed={a.isStarred}
                  aria-keyshortcuts="s"
                >
                  <StarIcon
                    size={14}
                    fill={a.isStarred ? "currentColor" : "none"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleRead(a.id, !a.isRead)}
                  className="min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2) text-(--muted)"
                  aria-label={a.isRead ? "Mark as unread" : "Mark as read"}
                  aria-pressed={a.isRead}
                  aria-keyshortcuts="m"
                >
                  <CheckIcon size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
