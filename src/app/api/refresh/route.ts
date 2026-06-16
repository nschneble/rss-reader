import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { refreshAllFeeds, refreshFeed } from "@/lib/feeds/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  ensureMigrated();
  const sp = req.nextUrl.searchParams;
  const feedId = sp.get("feedId");
  if (feedId) {
    try {
      const r = await refreshFeed(Number(feedId));
      return NextResponse.json({ feed: r.feed, newArticles: r.newArticles });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }
  const result = await refreshAllFeeds();
  return NextResponse.json(result);
}
