import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { listFeedsWithCounts } from "@/lib/db/queries";
import { subscribeToFeed } from "@/lib/feeds/store";

export const runtime = "nodejs";

export async function GET() {
  ensureMigrated();
  return NextResponse.json({ feeds: listFeedsWithCounts() });
}

export async function POST(req: NextRequest) {
  ensureMigrated();
  let body: { url?: string; folderId?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const url = body.url?.trim();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  try {
    const result = await subscribeToFeed(url, body.folderId ?? null);
    return NextResponse.json({ feed: result.feed, newArticles: result.newArticles });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
