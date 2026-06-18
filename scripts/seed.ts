import { ensureMigrated } from "../src/lib/db/migrate";
import { subscribeToFeed } from "../src/lib/feeds/store";
import { createFolderResolver } from "../src/lib/db/folders";

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
  const folderIdFor = createFolderResolver();

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
