import { createFolder, listFolders } from "./queries";

/**
 * Builds a name -> folder id resolver that creates folders on demand and caches
 * results by lowercased name. If a concurrent insert wins the unique-name race,
 * it re-reads to recover the existing id. Shared by OPML import and the seed
 * script so both resolve folders the same way.
 */
export function createFolderResolver() {
  const cache = new Map(listFolders().map((f) => [f.name.toLowerCase(), f.id]));

  return function folderIdFor(name: string | null | undefined): number | null {
    if (!name) return null;
    const key = name.toLowerCase();
    const cached = cache.get(key);
    if (cached) return cached;
    try {
      const folder = createFolder(name);
      cache.set(key, folder.id);
      return folder.id;
    } catch {
      const after = listFolders().find((f) => f.name.toLowerCase() === key);
      if (after) {
        cache.set(key, after.id);
        return after.id;
      }
      return null;
    }
  };
}
