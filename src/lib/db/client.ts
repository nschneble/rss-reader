import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.RSS_READER_DB ?? path.join(DB_DIR, "reader.db");

function getDb() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

declare global {
  var __rssReaderDb: ReturnType<typeof getDb> | undefined;
}

export const db = globalThis.__rssReaderDb ?? getDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__rssReaderDb = db;
}

export { schema };
