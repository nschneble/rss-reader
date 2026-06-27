import { db } from "../db/client";
import { feeds, articles, type Feed, type NewFeed } from "../db/schema";
import { eq } from "drizzle-orm";
import { fetchAndParseFeed, type ParsedFeed } from "./parse";

export type SubscribeResult = {
  feed: Feed;
  newArticles: number;
};

export async function subscribeToFeed(
  url: string,
  folderId: number | null = null,
): Promise<SubscribeResult> {
  // Subscribing to a URL you already follow is a no-op subscribe but a real
  // refresh: rather than erroring on the unique-url constraint, we just pull any
  // new articles for the existing feed.
  const existing = db.select().from(feeds).where(eq(feeds.url, url)).get();
  if (existing) {
    const result = await refreshFeed(existing.id);
    return { feed: result.feed, newArticles: result.newArticles };
  }
  const parsed = await fetchAndParseFeed(url);
  const inserted = db
    .insert(feeds)
    .values({
      url,
      title: parsed.title,
      siteUrl: parsed.siteUrl,
      description: parsed.description,
      iconUrl: parsed.iconUrl,
      folderId,
      lastFetchedAt: new Date(),
    } satisfies NewFeed)
    .returning()
    .get();
  const newArticles = upsertArticles(inserted.id, parsed);
  return { feed: inserted, newArticles };
}

export async function refreshFeed(
  feedId: number,
): Promise<{ feed: Feed; newArticles: number }> {
  const feed = db.select().from(feeds).where(eq(feeds.id, feedId)).get();
  if (!feed) throw new Error(`feed ${feedId} not found`);
  try {
    const parsed = await fetchAndParseFeed(feed.url);
    const newArticles = upsertArticles(feed.id, parsed);
    // On refresh, existing values win: we only backfill fields the feed never
    // had, so a manually-set title (or one from an earlier fetch) isn't
    // clobbered by whatever the feed currently advertises.
    const updated = db
      .update(feeds)
      .set({
        title: feed.title || parsed.title,
        siteUrl: feed.siteUrl ?? parsed.siteUrl,
        description: feed.description ?? parsed.description,
        iconUrl: feed.iconUrl ?? parsed.iconUrl,
        lastFetchedAt: new Date(),
        lastError: null,
      })
      .where(eq(feeds.id, feed.id))
      .returning()
      .get();
    return { feed: updated, newArticles };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    db.update(feeds)
      .set({ lastError: msg, lastFetchedAt: new Date() })
      .where(eq(feeds.id, feed.id))
      .run();
    throw err;
  }
}

export async function refreshAllFeeds(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  newArticles: number;
}> {
  const all = db.select().from(feeds).all();
  let succeeded = 0;
  let failed = 0;
  let newArticles = 0;
  for (const f of all) {
    try {
      const r = await refreshFeed(f.id);
      newArticles += r.newArticles;
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }
  return { total: all.length, succeeded, failed, newArticles };
}

// Inserts only articles we haven't seen before. Dedup is by the
// (feed_id, guid) unique index: onConflictDoNothing skips known items, so the
// returned count is the number of genuinely new articles.
function upsertArticles(feedId: number, parsed: ParsedFeed): number {
  let inserted = 0;
  for (const item of parsed.items) {
    const res = db
      .insert(articles)
      .values({
        feedId,
        guid: item.guid,
        title: item.title,
        url: item.url,
        author: item.author,
        content: item.content,
        summary: item.summary,
        publishedAt: item.publishedAt,
      })
      .onConflictDoNothing()
      .returning()
      .all();
    inserted += res.length;
  }
  return inserted;
}
