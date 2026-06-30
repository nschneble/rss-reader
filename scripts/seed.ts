import { ensureMigrated } from "../src/lib/db/migrate";
import { subscribeToFeed } from "../src/lib/feeds/store";
import { createFolderResolver } from "../src/lib/db/folders";

type SeedEntry = { folder: string; url: string };

const SEED: SeedEntry[] = [
  { folder: "Ideas", url: "https://aeon.co/feed.rss" },
  { folder: "Ideas", url: "https://solar.lowtechmagazine.com/posts/index.xml" },
  { folder: "Science", url: "https://nautil.us/feed/" },
  { folder: "Culture", url: "https://www.atlasobscura.com/feeds/latest" },
  { folder: "Art & Design", url: "https://www.thisiscolossal.com/feed" },
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
