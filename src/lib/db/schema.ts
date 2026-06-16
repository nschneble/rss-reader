import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const folders = sqliteTable(
  "folders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    nameIdx: uniqueIndex("folders_name_unique").on(t.name),
  }),
);

export const feeds = sqliteTable(
  "feeds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    siteUrl: text("site_url"),
    description: text("description"),
    iconUrl: text("icon_url"),
    folderId: integer("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
    lastError: text("last_error"),
    etag: text("etag"),
    lastModified: text("last_modified"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    urlIdx: uniqueIndex("feeds_url_unique").on(t.url),
    folderIdx: index("feeds_folder_idx").on(t.folderId),
  }),
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    author: text("author"),
    content: text("content"),
    summary: text("summary"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    fetchedAt: integer("fetched_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    isStarred: integer("is_starred", { mode: "boolean" }).notNull().default(false),
  },
  (t) => ({
    feedGuidIdx: uniqueIndex("articles_feed_guid_unique").on(t.feedId, t.guid),
    feedIdx: index("articles_feed_idx").on(t.feedId),
    publishedIdx: index("articles_published_idx").on(t.publishedAt),
    starredIdx: index("articles_starred_idx").on(t.isStarred),
    readIdx: index("articles_read_idx").on(t.isRead),
  }),
);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
