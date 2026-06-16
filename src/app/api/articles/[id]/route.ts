import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { getArticle, setArticleRead, setArticleStarred } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const artId = Number(id);
  if (!Number.isInteger(artId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  const art = getArticle(artId);
  if (!art) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ article: art });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const artId = Number(id);
  if (!Number.isInteger(artId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as {
    isRead?: boolean;
    isStarred?: boolean;
  };
  if (body.isRead !== undefined) setArticleRead(artId, body.isRead);
  if (body.isStarred !== undefined) setArticleStarred(artId, body.isStarred);
  return NextResponse.json({ ok: true });
}
