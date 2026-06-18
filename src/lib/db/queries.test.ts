import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./client";
import { ensureMigrated } from "./migrate";
import { feeds, articles, folders } from "./schema";
import {
  listArticles,
  markAllRead,
  markFeedRead,
  listFeedsWithCounts,
} from "./queries";

ensureMigrated();

function reset() {
  db.delete(articles).run();
  db.delete(feeds).run();
  db.delete(folders).run();
}

function seed() {
  const folder = db.insert(folders).values({ name: "News" }).returning().get();
  const feedA = db
    .insert(feeds)
    .values({ url: "https://a.com/feed", title: "A", folderId: folder.id })
    .returning()
    .get();
  const feedB = db
    .insert(feeds)
    .values({ url: "https://b.com/feed", title: "B", folderId: null })
    .returning()
    .get();
  db.insert(articles)
    .values([
      { feedId: feedA.id, guid: "a1", title: "A1", isRead: false },
      { feedId: feedA.id, guid: "a2", title: "A2", isRead: false },
      { feedId: feedB.id, guid: "b1", title: "B1", isRead: false },
    ])
    .run();
  return { folder, feedA, feedB };
}

beforeEach(() => reset());

describe("listArticles filters", () => {
  it("filters by feed", () => {
    const { feedA } = seed();
    expect(listArticles({ feedId: feedA.id })).toHaveLength(2);
  });

  it("filters by folder (joined through feeds)", () => {
    const { folder } = seed();
    expect(listArticles({ folderId: folder.id })).toHaveLength(2);
  });

  it("filters unread only", () => {
    const { feedB } = seed();
    db.update(articles).set({ isRead: true }).run();
    db.insert(articles)
      .values({ feedId: feedB.id, guid: "b2", title: "B2", isRead: false })
      .run();
    expect(listArticles({ unread: true })).toHaveLength(1);
  });
});

describe("markAllRead is scoped to the filter", () => {
  it("with no filter marks every unread article", () => {
    seed();
    const res = markAllRead();
    expect(res.changes).toBe(3);
    expect(listArticles({ unread: true })).toHaveLength(0);
  });

  it("scoped to a folder leaves articles outside it unread (regression)", () => {
    const { folder, feedB } = seed();
    const res = markAllRead({ folderId: folder.id });
    expect(res.changes).toBe(2); // only feed A's two articles
    const remaining = listArticles({ unread: true });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].feedId).toBe(feedB.id);
  });

  it("scoped to a feed marks only that feed", () => {
    const { feedB } = seed();
    const res = markAllRead({ feedId: feedB.id });
    expect(res.changes).toBe(1);
  });
});

describe("markFeedRead + counts", () => {
  it("markFeedRead only affects the given feed's unread rows", () => {
    const { feedA } = seed();
    markFeedRead(feedA.id);
    const counts = listFeedsWithCounts();
    const a = counts.find((c) => c.id === feedA.id);
    expect(a?.unreadCount).toBe(0);
  });

  it("listFeedsWithCounts reports 0 (not null) for a feed with no articles", () => {
    db.insert(feeds).values({ url: "https://c.com/feed", title: "C" }).run();
    const c = listFeedsWithCounts().find((x) => x.title === "C");
    expect(c?.unreadCount).toBe(0);
  });
});
