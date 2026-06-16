import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { parseOpml } from "@/lib/opml/opml";
import { createFolder, listFolders } from "@/lib/db/queries";
import { subscribeToFeed } from "@/lib/feeds/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  ensureMigrated();
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "form data required" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "file required" }, { status: 400 });
  const text = await file.text();
  const outlines = parseOpml(text);
  if (outlines.length === 0)
    return NextResponse.json({ error: "no feeds found in OPML" }, { status: 422 });

  const existingFolders = new Map(
    listFolders().map((f) => [f.name.toLowerCase(), f.id]),
  );

  function folderIdFor(name: string | null | undefined): number | null {
    if (!name) return null;
    const key = name.toLowerCase();
    const cached = existingFolders.get(key);
    if (cached) return cached;
    try {
      const folder = createFolder(name);
      existingFolders.set(key, folder.id);
      return folder.id;
    } catch {
      const after = listFolders().find(
        (f) => f.name.toLowerCase() === key,
      );
      if (after) {
        existingFolders.set(key, after.id);
        return after.id;
      }
      return null;
    }
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const o of outlines) {
    const folderId = folderIdFor(o.folder);
    try {
      const result = await subscribeToFeed(o.xmlUrl, folderId);
      if (result.newArticles > 0 || result.feed) imported += 1;
      else skipped += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${o.title || o.xmlUrl}: ${msg}`);
    }
  }
  return NextResponse.json({ imported, skipped, errors });
}
