import { NextResponse } from "next/server";
import { markAllRead, type ArticleFilter } from "@/lib/db/queries";
import { route, parseIntParam } from "@/lib/api/http";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  const filter: ArticleFilter = {};
  const feedId = parseIntParam(sp.get("feedId"));
  const folderId = parseIntParam(sp.get("folderId"));
  if (feedId != null) filter.feedId = feedId;
  if (folderId != null) filter.folderId = folderId;
  if (sp.get("starred") === "1") filter.starred = true;
  const search = sp.get("search");
  if (search) filter.search = search;
  const result = markAllRead(filter);
  return NextResponse.json({ ok: true, updated: result.changes });
});
