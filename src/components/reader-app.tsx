"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  type ArticleDetailDTO,
  type ArticleListDTO,
  type FeedDTO,
  type FolderDTO,
} from "@/lib/api-client";
import { Sidebar, type Selection } from "./sidebar";
import { ArticleList } from "./article-list";
import { Reader } from "./reader";
import { AddFeedDialog } from "./add-feed-dialog";
import { NewFolderDialog } from "./new-folder-dialog";
import { ConfirmDialog, type ConfirmRequest } from "./confirm-dialog";

type Pane = "sidebar" | "list" | "reader";

const REFRESH_INTERVAL_MS = 5 * 60_000;

export function ReaderApp() {
  const [feeds, setFeeds] = useState<FeedDTO[]>([]);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [articles, setArticles] = useState<ArticleListDTO[]>([]);
  const [selection, setSelection] = useState<Selection>({ kind: "all" });
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [activeArticle, setActiveArticle] = useState<ArticleDetailDTO | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addFeedOpen, setAddFeedOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<Pane>("sidebar");
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  // Separate from `liveMessage` (driven by the article-list effect) so action
  // results — mark-all, refresh, OPML import — aren't clobbered by a list update.
  const [actionMessage, setActionMessage] = useState("");
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const anyModalOpen = addFeedOpen || newFolderOpen || confirmRequest != null;

  const totalUnread = feeds.reduce((s, f) => s + f.unreadCount, 0);
  const starredCount = useMemo(
    () => articles.filter((a) => a.isStarred).length,
    // counted at fetch time; we keep a running approximation
    [articles],
  );

  const refreshSidebar = useCallback(async () => {
    try {
      const [{ feeds: f }, { folders: fl }] = await Promise.all([
        api.feeds.list(),
        api.folders.list(),
      ]);
      setFeeds(f);
      setFolders(fl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const refreshArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const params: Parameters<typeof api.articles.list>[0] = {
        search: debouncedSearch.trim() || undefined,
        unread: showUnreadOnly || undefined,
      };
      if (selection.kind === "feed") params.feedId = selection.id;
      else if (selection.kind === "folder") params.folderId = selection.id;
      else if (selection.kind === "starred") {
        params.starred = true;
        params.unread = undefined;
      }
      const { articles: a } = await api.articles.list(params);
      setArticles(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingArticles(false);
    }
  }, [debouncedSearch, showUnreadOnly, selection]);

  useEffect(() => {
    refreshSidebar();
  }, [refreshSidebar]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  useEffect(() => {
    if (loadingArticles) return;
    const count = articles.length;
    setLiveMessage(
      count === 0
        ? `No articles in ${selectionTitle}.`
        : `Showing ${count} article${count === 1 ? "" : "s"} in ${selectionTitle}.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, loadingArticles]);

  useEffect(() => {
    if (selectedArticleId == null) {
      setActiveArticle(null);
      return;
    }
    let cancelled = false;
    setLoadingActive(true);
    api.articles
      .get(selectedArticleId)
      .then(({ article }) => {
        if (!cancelled) setActiveArticle(article);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => !cancelled && setLoadingActive(false));
    return () => {
      cancelled = true;
    };
  }, [selectedArticleId]);

  // Periodic background refresh
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await api.refresh();
        await refreshSidebar();
        await refreshArticles();
      } catch {
        // silent in background
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshSidebar, refreshArticles]);

  const selectionTitle = useMemo(() => {
    if (selection.kind === "all") return "All articles";
    if (selection.kind === "starred") return "Starred";
    if (selection.kind === "feed") {
      const f = feeds.find((x) => x.id === selection.id);
      return f?.title ?? "Feed";
    }
    if (selection.kind === "folder") {
      const fl = folders.find((x) => x.id === selection.id);
      return fl?.name ?? "Folder";
    }
    return "Articles";
  }, [selection, feeds, folders]);

  const handleSelectArticle = useCallback(
    async (id: number) => {
      setSelectedArticleId(id);
      setMobilePane("reader");
      const target = articles.find((a) => a.id === id);
      if (target && !target.isRead) {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
        );
        setFeeds((prev) =>
          prev.map((f) =>
            f.id === target.feedId
              ? { ...f, unreadCount: Math.max(0, f.unreadCount - 1) }
              : f,
          ),
        );
        try {
          await api.articles.setRead(id, true);
        } catch {
          // ignore
        }
      }
    },
    [articles],
  );

  const handleToggleStar = useCallback(
    async (id: number, next: boolean) => {
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isStarred: next } : a)),
      );
      setActiveArticle((prev) =>
        prev && prev.id === id ? { ...prev, isStarred: next } : prev,
      );
      try {
        await api.articles.setStarred(id, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [],
  );

  const handleToggleRead = useCallback(
    async (id: number, next: boolean) => {
      let delta = 0;
      let feedId: number | null = null;
      setArticles((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            if (a.isRead !== next) {
              delta = next ? -1 : 1;
              feedId = a.feedId;
            }
            return { ...a, isRead: next };
          }
          return a;
        }),
      );
      setActiveArticle((prev) =>
        prev && prev.id === id ? { ...prev, isRead: next } : prev,
      );
      if (feedId != null) {
        const fid = feedId;
        const d = delta;
        setFeeds((prev) =>
          prev.map((f) =>
            f.id === fid
              ? { ...f, unreadCount: Math.max(0, f.unreadCount + d) }
              : f,
          ),
        );
      }
      try {
        await api.articles.setRead(id, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [],
  );

  const handleMarkAllRead = useCallback(() => {
    setConfirmRequest({
      title: "Mark all read",
      message: `Mark all articles in ${selectionTitle} as read?`,
      confirmLabel: "Mark all read",
      onConfirm: async () => {
        const params: Parameters<typeof api.articles.markAllRead>[0] = {
          search: debouncedSearch.trim() || undefined,
        };
        if (selection.kind === "feed") params.feedId = selection.id;
        else if (selection.kind === "folder") params.folderId = selection.id;
        else if (selection.kind === "starred") params.starred = true;
        try {
          const { updated } = await api.articles.markAllRead(params);
          setActionMessage(
            `Marked ${updated} article${updated === 1 ? "" : "s"} as read in ${selectionTitle}.`,
          );
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
        await refreshSidebar();
        await refreshArticles();
      },
    });
  }, [selection, selectionTitle, debouncedSearch, refreshSidebar, refreshArticles]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (selection.kind === "feed") {
        await api.refresh(selection.id);
      } else {
        await api.refresh();
      }
      await refreshSidebar();
      await refreshArticles();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, selection, refreshSidebar, refreshArticles]);

  const handleAddFeed = useCallback(
    async (url: string) => {
      const result = await api.feeds.subscribe(url);
      await refreshSidebar();
      setSelection({ kind: "feed", id: result.feed.id });
      setMobilePane("list");
      await refreshArticles();
    },
    [refreshSidebar, refreshArticles],
  );

  const handleCreateFolder = useCallback(
    async (name: string) => {
      await api.folders.create(name);
      await refreshSidebar();
    },
    [refreshSidebar],
  );

  const handleRemoveFeed = useCallback(
    (id: number, title: string) => {
      setConfirmRequest({
        title: "Unsubscribe",
        message: `Unsubscribe from "${title}"? Articles will be deleted.`,
        confirmLabel: "Unsubscribe",
        destructive: true,
        onConfirm: async () => {
          try {
            await api.feeds.remove(id);
            if (selection.kind === "feed" && selection.id === id) {
              setSelection({ kind: "all" });
            }
            setActionMessage(`Unsubscribed from ${title}.`);
            await refreshSidebar();
            await refreshArticles();
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        },
      });
    },
    [selection, refreshSidebar, refreshArticles],
  );

  const handleRemoveFolder = useCallback(
    (id: number, name: string) => {
      setConfirmRequest({
        title: "Delete folder",
        message: `Delete folder "${name}"? Feeds inside will be unfiled.`,
        confirmLabel: "Delete folder",
        destructive: true,
        onConfirm: async () => {
          try {
            await api.folders.remove(id);
            if (selection.kind === "folder" && selection.id === id) {
              setSelection({ kind: "all" });
            }
            setActionMessage(`Deleted folder ${name}.`);
            await refreshSidebar();
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        },
      });
    },
    [selection, refreshSidebar],
  );

  const handleAssignFolder = useCallback(
    async (feedId: number, folderId: number | null) => {
      try {
        await api.feeds.setFolder(feedId, folderId);
        await refreshSidebar();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [refreshSidebar],
  );

  const opmlInputRef = useRef<HTMLInputElement>(null);

  const handleImportOpml = useCallback(() => {
    opmlInputRef.current?.click();
  }, []);

  const handleOpmlFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setRefreshing(true);
      try {
        const result = await api.opml.importFile(file);
        await refreshSidebar();
        setActionMessage(
          `Imported ${result.imported} feed${result.imported === 1 ? "" : "s"}, skipped ${result.skipped}.`,
        );
        if (result.errors.length) {
          setError(
            `OPML import had ${result.errors.length} error${result.errors.length === 1 ? "" : "s"}: ${result.errors.slice(0, 5).join("; ")}`,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setRefreshing(false);
      }
    },
    [refreshSidebar],
  );

  // Keyboard shortcuts: j/k navigate, m mark read, s star, r refresh, / focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isField) {
        if (e.key === "Escape" && target.tagName === "INPUT") {
          (target as HTMLInputElement).blur();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        if (!articles.length) return;
        const idx = articles.findIndex((a) => a.id === selectedArticleId);
        let nextIdx: number;
        if (e.key === "j")
          nextIdx = idx < 0 ? 0 : Math.min(articles.length - 1, idx + 1);
        else nextIdx = idx < 0 ? 0 : Math.max(0, idx - 1);
        handleSelectArticle(articles[nextIdx].id);
      } else if (e.key === "s" && selectedArticleId != null) {
        const a = articles.find((x) => x.id === selectedArticleId);
        if (a) handleToggleStar(a.id, !a.isStarred);
      } else if (e.key === "m" && selectedArticleId != null) {
        const a = articles.find((x) => x.id === selectedArticleId);
        if (a) handleToggleRead(a.id, !a.isRead);
      } else if (e.key === "r") {
        handleRefresh();
      } else if (e.key === "/") {
        e.preventDefault();
        const s = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        s?.focus();
      } else if (e.key === "u") {
        setShowUnreadOnly((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    articles,
    selectedArticleId,
    handleSelectArticle,
    handleToggleStar,
    handleToggleRead,
    handleRefresh,
  ]);

  const selectionKey =
    selection.kind +
    ("id" in selection ? `:${selection.id}` : "");

  // Reset selected when selection target changes
  useEffect(() => {
    setSelectedArticleId(null);
    setActiveArticle(null);
  }, [selectionKey]);

  return (
    // contain-paint stops the article list's nested scroller from leaking its
    // height to the document (full-page height would otherwise equal the list).
    // It also makes this the containing block for the fixed overlays/toast below
    // — safe only while this box stays coincident with the viewport (h-screen,
    // full width, no transform/margin). Keep it that way.
    <div className="h-screen flex flex-col contain-paint">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-(--background) focus:text-(--foreground) focus:px-3 focus:py-2 focus:rounded focus:border focus:border-(--border) focus:shadow-lg"
      >
        Skip to articles
      </a>
      <h1 className="sr-only">RSS Reader</h1>
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {actionMessage}
      </div>
      <input
        ref={opmlInputRef}
        type="file"
        accept=".opml,.xml,application/xml,text/xml"
        onChange={handleOpmlFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        className="grid flex-1 min-h-0 grid-rows-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(340px,400px)_1fr]"
        inert={anyModalOpen || undefined}
      >
        <div
          className={`${
            mobilePane === "sidebar" ? "block" : "hidden"
          } lg:block min-h-0`}
        >
          <Sidebar
            feeds={feeds}
            folders={folders}
            totalUnread={totalUnread}
            starredCount={starredCount}
            selection={selection}
            onSelect={(s) => {
              setSelection(s);
              setMobilePane("list");
            }}
            onAddFeed={() => setAddFeedOpen(true)}
            onCreateFolder={() => setNewFolderOpen(true)}
            onImportOpml={handleImportOpml}
            onRemoveFeed={handleRemoveFeed}
            onRemoveFolder={handleRemoveFolder}
            onAssignFolder={handleAssignFolder}
            onRefreshAll={handleRefresh}
            refreshing={refreshing}
          />
        </div>

        <main id="main-content" tabIndex={-1} className="contents">
        <div
          className={`${
            mobilePane === "list" ? "block" : "hidden"
          } lg:block min-h-0`}
        >
          <ArticleList
            title={selectionTitle}
            articles={articles}
            selectedId={selectedArticleId}
            showUnreadOnly={showUnreadOnly}
            search={search}
            onSelect={handleSelectArticle}
            onToggleStar={handleToggleStar}
            onToggleRead={handleToggleRead}
            onSearchChange={setSearch}
            onToggleUnreadOnly={() => setShowUnreadOnly((v) => !v)}
            onMarkAllRead={handleMarkAllRead}
            onRefresh={handleRefresh}
            onBack={() => setMobilePane("sidebar")}
            refreshing={refreshing}
            loading={loadingArticles}
          />
        </div>

        <div
          className={`${
            mobilePane === "reader" ? "block" : "hidden"
          } lg:block min-h-0`}
        >
          <Reader
            article={activeArticle}
            loading={loadingActive}
            onToggleStar={() =>
              activeArticle &&
              handleToggleStar(activeArticle.id, !activeArticle.isStarred)
            }
            onToggleRead={() =>
              activeArticle &&
              handleToggleRead(activeArticle.id, !activeArticle.isRead)
            }
            onBack={() => setMobilePane("list")}
          />
        </div>
        </main>
      </div>

      {error && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 max-w-sm bg-(--danger) text-white text-sm px-3 py-2 rounded shadow-lg flex items-start gap-2"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="opacity-80 hover:opacity-100"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <AddFeedDialog
        open={addFeedOpen}
        onClose={() => setAddFeedOpen(false)}
        onSubmit={handleAddFeed}
      />
      <NewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />
      <ConfirmDialog
        request={confirmRequest}
        onClose={() => setConfirmRequest(null)}
      />
    </div>
  );
}
