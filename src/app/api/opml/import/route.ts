import { NextResponse } from "next/server";
import { parseOpml } from "@/lib/opml/opml";
import { createFolderResolver } from "@/lib/db/folders";
import { subscribeToFeed } from "@/lib/feeds/store";
import { route, bad } from "@/lib/api/http";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const form = await req.formData().catch(() => null);
  if (!form) bad("form data required");
  const file = form.get("file");
  if (!(file instanceof File)) bad("file required");
  const outlines = parseOpml(await file.text());
  if (outlines.length === 0) bad("no feeds found in OPML", 422);

  const folderIdFor = createFolderResolver();
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
      errors.push(`${o.title || o.xmlUrl}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return NextResponse.json({ imported, skipped, errors });
});
