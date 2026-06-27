import { NextResponse } from "next/server";
import { refreshAllFeeds, refreshFeed } from "@/lib/feeds/store";
import { route, parseIntParam, bad, ApiError } from "@/lib/api/http";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const raw = req.nextUrl.searchParams.get("feedId");
  if (raw) {
    const id = parseIntParam(raw) ?? bad("bad id");
    try {
      const r = await refreshFeed(id);
      return NextResponse.json({ feed: r.feed, newArticles: r.newArticles });
    } catch (e) {
      throw new ApiError(502, e instanceof Error ? e.message : String(e));
    }
  }
  return NextResponse.json(await refreshAllFeeds());
});
