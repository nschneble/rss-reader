import { NextResponse } from "next/server";
import { assignFeedToFolder, deleteFeed } from "@/lib/db/queries";
import { route, requireId, readBody, bad, type RouteContext } from "@/lib/api/http";

export const runtime = "nodejs";

export const PATCH = route<RouteContext>(async (req, ctx) => {
  const id = await requireId(ctx);
  const body = await readBody<{ folderId?: number | null }>(req);
  if (body.folderId === undefined) bad("no-op");
  const feed = assignFeedToFolder(id, body.folderId);
  return NextResponse.json({ feed });
});

export const DELETE = route<RouteContext>(async (_req, ctx) => {
  const id = await requireId(ctx);
  deleteFeed(id);
  return NextResponse.json({ ok: true });
});
