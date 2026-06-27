export type FeedDTO = {
  id: number;
  title: string;
  url: string;
  siteUrl: string | null;
  iconUrl: string | null;
  folderId: number | null;
  unreadCount: number;
  lastError: string | null;
  lastFetchedAt: string | null;
};

export type FolderDTO = {
  id: number;
  name: string;
  position: number;
  createdAt: string;
};

export type ArticleListDTO = {
  id: number;
  feedId: number;
  feedTitle: string;
  feedIconUrl: string | null;
  title: string;
  url: string | null;
  author: string | null;
  summary: string | null;
  publishedAt: string | null;
  isRead: boolean;
  isStarred: boolean;
};

export type ArticleDetailDTO = ArticleListDTO & {
  content: string;
  feedSiteUrl: string | null;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (data as { error?: string })?.error ?? r.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  feeds: {
    list: () => jsonFetch<{ feeds: FeedDTO[] }>("/api/feeds"),
    subscribe: (url: string, folderId: number | null = null) =>
      jsonFetch<{ feed: FeedDTO; newArticles: number }>("/api/feeds", {
        method: "POST",
        body: JSON.stringify({ url, folderId }),
      }),
    setFolder: (id: number, folderId: number | null) =>
      jsonFetch<{ feed: FeedDTO }>(`/api/feeds/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ folderId }),
      }),
    remove: (id: number) =>
      jsonFetch<{ ok: true }>(`/api/feeds/${id}`, { method: "DELETE" }),
    markRead: (id: number) =>
      jsonFetch<{ ok: true }>(`/api/feeds/${id}/mark-read`, { method: "POST" }),
  },
  folders: {
    list: () => jsonFetch<{ folders: FolderDTO[] }>("/api/folders"),
    create: (name: string) =>
      jsonFetch<{ folder: FolderDTO }>("/api/folders", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    rename: (id: number, name: string) =>
      jsonFetch<{ folder: FolderDTO }>(`/api/folders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    remove: (id: number) =>
      jsonFetch<{ ok: true }>(`/api/folders/${id}`, { method: "DELETE" }),
  },
  articles: {
    list: (params: {
      feedId?: number;
      folderId?: number;
      starred?: boolean;
      unread?: boolean;
      search?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params.feedId != null) sp.set("feedId", String(params.feedId));
      if (params.folderId != null) sp.set("folderId", String(params.folderId));
      if (params.starred) sp.set("starred", "1");
      if (params.unread) sp.set("unread", "1");
      if (params.search) sp.set("search", params.search);
      return jsonFetch<{ articles: ArticleListDTO[] }>(
        `/api/articles?${sp.toString()}`,
      );
    },
    get: (id: number) =>
      jsonFetch<{ article: ArticleDetailDTO }>(`/api/articles/${id}`),
    setRead: (id: number, isRead: boolean) =>
      jsonFetch<{ ok: true }>(`/api/articles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead }),
      }),
    setStarred: (id: number, isStarred: boolean) =>
      jsonFetch<{ ok: true }>(`/api/articles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isStarred }),
      }),
    markAllRead: (params: {
      feedId?: number;
      folderId?: number;
      starred?: boolean;
      search?: string;
    } = {}) => {
      const sp = new URLSearchParams();
      if (params.feedId != null) sp.set("feedId", String(params.feedId));
      if (params.folderId != null) sp.set("folderId", String(params.folderId));
      if (params.starred) sp.set("starred", "1");
      if (params.search) sp.set("search", params.search);
      const qs = sp.toString();
      return jsonFetch<{ ok: true; updated: number }>(
        `/api/articles/mark-all-read${qs ? `?${qs}` : ""}`,
        { method: "POST" },
      );
    },
  },
  refresh: (feedId?: number) => {
    const url = feedId != null ? `/api/refresh?feedId=${feedId}` : "/api/refresh";
    return jsonFetch<{
      feed?: FeedDTO;
      newArticles?: number;
      total?: number;
      succeeded?: number;
      failed?: number;
    }>(url, { method: "POST" });
  },
  opml: {
    importFile: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/opml/import", { method: "POST", body: fd });
      const data = (await r.json().catch(() => ({}))) as {
        imported?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!r.ok) throw new Error(data.error ?? r.statusText);
      return data as { imported: number; skipped: number; errors: string[] };
    },
    exportUrl: () => "/api/opml/export",
  },
};
