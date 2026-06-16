import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { listArticles, type ArticleFilter } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  ensureMigrated();
  const sp = req.nextUrl.searchParams;
  const filter: ArticleFilter = {};
  const feedId = sp.get("feedId");
  const folderId = sp.get("folderId");
  if (feedId) filter.feedId = Number(feedId);
  if (folderId) filter.folderId = Number(folderId);
  if (sp.get("starred") === "1") filter.starred = true;
  if (sp.get("unread") === "1") filter.unread = true;
  const search = sp.get("search");
  if (search) filter.search = search;
  const limit = sp.get("limit");
  const offset = sp.get("offset");
  if (limit) filter.limit = Math.min(Number(limit), 500);
  if (offset) filter.offset = Number(offset);
  return NextResponse.json({ articles: listArticles(filter) });
}
