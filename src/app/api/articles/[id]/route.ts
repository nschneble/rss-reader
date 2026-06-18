import { NextResponse } from "next/server";
import { getArticle, setArticleRead, setArticleStarred } from "@/lib/db/queries";
import { route, requireId, readBody, bad, type RouteContext } from "@/lib/api/http";

export const runtime = "nodejs";

export const GET = route<RouteContext>(async (_req, ctx) => {
  const id = await requireId(ctx);
  const article = getArticle(id);
  if (!article) bad("not found", 404);
  return NextResponse.json({ article });
});

export const PATCH = route<RouteContext>(async (req, ctx) => {
  const id = await requireId(ctx);
  const body = await readBody<{ isRead?: boolean; isStarred?: boolean }>(req);
  if (body.isRead !== undefined) setArticleRead(id, body.isRead);
  if (body.isStarred !== undefined) setArticleStarred(id, body.isStarred);
  return NextResponse.json({ ok: true });
});
