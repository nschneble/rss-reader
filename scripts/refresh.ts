import { ensureMigrated } from "../src/lib/db/migrate";
import { refreshAllFeeds } from "../src/lib/feeds/store";

async function main() {
  ensureMigrated();
  const result = await refreshAllFeeds();
  console.log(
    `refreshed ${result.succeeded}/${result.total} feeds, ${result.failed} failed, ${result.newArticles} new articles`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
