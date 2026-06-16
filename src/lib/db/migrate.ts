import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { db } from "./client";

let migrated = false;

export function ensureMigrated() {
  if (migrated) return;
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  migrated = true;
}
