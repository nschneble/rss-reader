import { db } from "./client";
import { feeds, articles, folders } from "./schema";
import { eq, and, desc, sql, or, like, isNull } from "drizzle-orm";

export type ArticleListItem = {
  id: number;
  feedId: number;
  feedTitle: string;
  feedIconUrl: string | null;
  title: string;
  url: string | null;
  author: string | null;
  summary: string | null;
  publishedAt: Date | null;
  isRead: boolean;
  isStarred: boolean;
};

export type ArticleFilter = {
  feedId?: number;
  folderId?: number;
  starred?: boolean;
  unread?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export function listArticles(filter: ArticleFilter = {}): ArticleListItem[] {
  const conditions = [] as ReturnType<typeof eq>[];
  if (filter.feedId != null) conditions.push(eq(articles.feedId, filter.feedId));
  if (filter.folderId != null) conditions.push(eq(feeds.folderId, filter.folderId));
  if (filter.starred) conditions.push(eq(articles.isStarred, true));
  if (filter.unread) conditions.push(eq(articles.isRead, false));
  if (filter.search && filter.search.trim()) {
    const q = `%${filter.search.trim()}%`;
    const search = or(
      like(articles.title, q),
      like(articles.summary, q),
      like(articles.content, q),
      like(articles.author, q),
    );
    if (search) conditions.push(search as unknown as ReturnType<typeof eq>);
  }

  const limit = filter.limit ?? 100;
  const offset = filter.offset ?? 0;

  const rows = db
    .select({
      id: articles.id,
      feedId: articles.feedId,
      feedTitle: feeds.title,
      feedIconUrl: feeds.iconUrl,
      title: articles.title,
      url: articles.url,
      author: articles.author,
      summary: articles.summary,
      publishedAt: articles.publishedAt,
      isRead: articles.isRead,
      isStarred: articles.isStarred,
    })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(limit)
    .offset(offset)
    .all();

  return rows;
}

export function getArticle(id: number) {
  return db
    .select({
      id: articles.id,
      feedId: articles.feedId,
      feedTitle: feeds.title,
      feedSiteUrl: feeds.siteUrl,
      title: articles.title,
      url: articles.url,
      author: articles.author,
      content: articles.content,
      summary: articles.summary,
      publishedAt: articles.publishedAt,
      isRead: articles.isRead,
      isStarred: articles.isStarred,
    })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .where(eq(articles.id, id))
    .get();
}

export function setArticleRead(id: number, isRead: boolean) {
  return db.update(articles).set({ isRead }).where(eq(articles.id, id)).run();
}

export function setArticleStarred(id: number, isStarred: boolean) {
  return db.update(articles).set({ isStarred }).where(eq(articles.id, id)).run();
}

export function markFeedRead(feedId: number) {
  return db
    .update(articles)
    .set({ isRead: true })
    .where(and(eq(articles.feedId, feedId), eq(articles.isRead, false)))
    .run();
}

export function markAllRead() {
  return db.update(articles).set({ isRead: true }).where(eq(articles.isRead, false)).run();
}

export type FeedWithCounts = {
  id: number;
  title: string;
  url: string;
  siteUrl: string | null;
  iconUrl: string | null;
  folderId: number | null;
  unreadCount: number;
  lastError: string | null;
  lastFetchedAt: Date | null;
};

export function listFeedsWithCounts(): FeedWithCounts[] {
  return db
    .select({
      id: feeds.id,
      title: feeds.title,
      url: feeds.url,
      siteUrl: feeds.siteUrl,
      iconUrl: feeds.iconUrl,
      folderId: feeds.folderId,
      lastError: feeds.lastError,
      lastFetchedAt: feeds.lastFetchedAt,
      unreadCount: sql<number>`COALESCE(SUM(CASE WHEN ${articles.isRead} = 0 THEN 1 ELSE 0 END), 0)`,
    })
    .from(feeds)
    .leftJoin(articles, eq(articles.feedId, feeds.id))
    .groupBy(feeds.id)
    .orderBy(feeds.title)
    .all();
}

export function listFolders() {
  return db.select().from(folders).orderBy(folders.position, folders.name).all();
}

export function createFolder(name: string) {
  return db.insert(folders).values({ name }).returning().get();
}

export function renameFolder(id: number, name: string) {
  return db.update(folders).set({ name }).where(eq(folders.id, id)).returning().get();
}

export function deleteFolder(id: number) {
  return db.delete(folders).where(eq(folders.id, id)).run();
}

export function assignFeedToFolder(feedId: number, folderId: number | null) {
  return db.update(feeds).set({ folderId }).where(eq(feeds.id, feedId)).returning().get();
}

export function deleteFeed(id: number) {
  return db.delete(feeds).where(eq(feeds.id, id)).run();
}

export function getStarredCount(): number {
  const r = db
    .select({ c: sql<number>`COUNT(*)` })
    .from(articles)
    .where(eq(articles.isStarred, true))
    .get();
  return r?.c ?? 0;
}

export function getUnreadTotal(): number {
  const r = db
    .select({ c: sql<number>`COUNT(*)` })
    .from(articles)
    .where(eq(articles.isRead, false))
    .get();
  return r?.c ?? 0;
}

export function getUnreadInFolder(folderId: number | null): number {
  const condition =
    folderId === null
      ? and(isNull(feeds.folderId), eq(articles.isRead, false))
      : and(eq(feeds.folderId, folderId), eq(articles.isRead, false));
  const r = db
    .select({ c: sql<number>`COUNT(*)` })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .where(condition)
    .get();
  return r?.c ?? 0;
}
