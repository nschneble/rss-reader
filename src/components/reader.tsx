"use client";

import { useEffect } from "react";
import type { ArticleDetailDTO } from "@/lib/api-client";
import {
  ArrowLeftIcon,
  ExternalIcon,
  StarIcon,
  CheckIcon,
} from "./icons";

type Props = {
  article: ArticleDetailDTO | null;
  loading: boolean;
  onToggleStar: () => void;
  onToggleRead: () => void;
  onBack?: () => void;
};

export function Reader({
  article,
  loading,
  onToggleStar,
  onToggleRead,
  onBack,
}: Props) {
  useEffect(() => {
    if (!article) return;
    const el = document.getElementById("reader-scroll");
    if (el) el.scrollTo({ top: 0 });
  }, [article]);

  if (loading) {
    return (
      <section
        className="h-full flex items-center justify-center text-sm text-(--muted)"
        aria-live="polite"
        aria-busy="true"
      >
        Loading…
      </section>
    );
  }

  if (!article) {
    return (
      <section
        className="hidden lg:flex h-full flex-col items-center justify-center text-sm text-(--muted) p-8"
        aria-label="Reader"
      >
        <p>Select an article to read.</p>
      </section>
    );
  }

  return (
    <section
      className="flex h-full flex-col bg-(--background)"
      aria-label="Article reader"
    >
      <div className="border-b border-(--border) px-4 sm:px-6 py-3 flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded hover:bg-(--surface-2) lg:hidden"
            aria-label="Back to list"
          >
            <ArrowLeftIcon size={16} />
          </button>
        )}
        <span className="flex-1 text-xs text-(--muted) truncate">
          {article.feedTitle}
        </span>
        <button
          type="button"
          onClick={onToggleStar}
          className={`p-1.5 rounded hover:bg-(--surface-2) ${
            article.isStarred ? "text-amber-500" : "text-(--muted)"
          }`}
          aria-label={article.isStarred ? "Unstar article" : "Star article"}
          aria-pressed={article.isStarred}
        >
          <StarIcon
            size={16}
            fill={article.isStarred ? "currentColor" : "none"}
          />
        </button>
        <button
          type="button"
          onClick={onToggleRead}
          className="p-1.5 rounded hover:bg-(--surface-2) text-(--muted)"
          aria-label={article.isRead ? "Mark as unread" : "Mark as read"}
          aria-pressed={article.isRead}
        >
          <CheckIcon size={16} />
        </button>
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-(--surface-2) text-(--muted) inline-flex"
            aria-label="Open original in new tab"
            title="Open original"
          >
            <ExternalIcon size={16} />
          </a>
        )}
      </div>

      <div
        id="reader-scroll"
        className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-8 py-6"
      >
        <article className="mx-auto prose-reader">
          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2">
              {article.url ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="!no-underline hover:underline"
                >
                  {article.title}
                </a>
              ) : (
                article.title
              )}
            </h1>
            <div className="text-sm text-(--muted) flex flex-wrap items-center gap-x-3 gap-y-1">
              {article.author && <span>{article.author}</span>}
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              )}
            </div>
          </header>
          <div dangerouslySetInnerHTML={{ __html: article.content || "" }} />
          {!article.content && (
            <p className="text-(--muted)">
              No content available.{" "}
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--accent) underline"
                >
                  Read original →
                </a>
              )}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
