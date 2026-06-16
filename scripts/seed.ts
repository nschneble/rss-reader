import { ensureMigrated } from "../src/lib/db/migrate";
import { subscribeToFeed } from "../src/lib/feeds/store";
import { createFolder, listFolders } from "../src/lib/db/queries";

type SeedEntry = { folder: string; url: string };

const SEED: SeedEntry[] = [
  { folder: "Tech", url: "https://news.ycombinator.com/rss" },
  { folder: "Tech", url: "https://lobste.rs/rss" },
  { folder: "Tech", url: "https://www.theverge.com/rss/index.xml" },
  { folder: "News", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { folder: "News", url: "https://www.reuters.com/arc/outboundfeeds/rss/category/world/?outputType=xml" },
  { folder: "Engineering", url: "https://nextjs.org/feed.xml" },
  { folder: "Engineering", url: "https://overreacted.io/rss.xml" },
];

async function main() {
  ensureMigrated();
  const existing = new Map(
    listFolders().map((f) => [f.name.toLowerCase(), f.id]),
  );
  function folderIdFor(name: string): number {
    const key = name.toLowerCase();
    const found = existing.get(key);
    if (found) return found;
    const folder = createFolder(name);
    existing.set(key, folder.id);
    return folder.id;
  }

  let added = 0;
  for (const entry of SEED) {
    try {
      const folderId = folderIdFor(entry.folder);
      const r = await subscribeToFeed(entry.url, folderId);
      console.log(`✓ ${r.feed.title} (+${r.newArticles})`);
      added += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`✗ ${entry.url}: ${msg}`);
    }
  }
  console.log(`\nseeded ${added}/${SEED.length} feeds`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
