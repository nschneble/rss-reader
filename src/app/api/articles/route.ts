import { NextResponse } from "next/server";
import { listArticles, type ArticleFilter } from "@/lib/db/queries";
import { route, parseIntParam } from "@/lib/api/http";

export const runtime = "nodejs";

export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  const filter: ArticleFilter = {};
  const feedId = parseIntParam(sp.get("feedId"));
  const folderId = parseIntParam(sp.get("folderId"));
  if (feedId != null) filter.feedId = feedId;
  if (folderId != null) filter.folderId = folderId;
  if (sp.get("starred") === "1") filter.starred = true;
  if (sp.get("unread") === "1") filter.unread = true;
  const search = sp.get("search");
  if (search) filter.search = search;
  const limit = parseIntParam(sp.get("limit"));
  const offset = parseIntParam(sp.get("offset"));
  if (limit != null) filter.limit = Math.min(Math.max(limit, 0), 500);
  if (offset != null) filter.offset = Math.max(offset, 0);
  return NextResponse.json({ articles: listArticles(filter) });
});
