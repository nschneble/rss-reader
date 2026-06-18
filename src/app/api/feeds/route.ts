import { NextResponse } from "next/server";
import { listFeedsWithCounts } from "@/lib/db/queries";
import { subscribeToFeed } from "@/lib/feeds/store";
import { route, readBody, bad, ApiError } from "@/lib/api/http";

export const runtime = "nodejs";

export const GET = route(async () => {
  return NextResponse.json({ feeds: listFeedsWithCounts() });
});

export const POST = route(async (req) => {
  const body = await readBody<{ url?: string; folderId?: number | null }>(req);
  const url = body.url?.trim();
  if (!url) bad("url required");
  try {
    const result = await subscribeToFeed(url, body.folderId ?? null);
    return NextResponse.json({ feed: result.feed, newArticles: result.newArticles });
  } catch (e) {
    // Upstream feed fetch/parse failed — surface as a bad gateway.
    throw new ApiError(502, e instanceof Error ? e.message : String(e));
  }
});
