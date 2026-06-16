import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { assignFeedToFolder, deleteFeed } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const feedId = Number(id);
  if (!Number.isInteger(feedId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as {
    folderId?: number | null;
  };
  if (body.folderId !== undefined) {
    const feed = assignFeedToFolder(feedId, body.folderId);
    return NextResponse.json({ feed });
  }
  return NextResponse.json({ error: "no-op" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const feedId = Number(id);
  if (!Number.isInteger(feedId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  deleteFeed(feedId);
  return NextResponse.json({ ok: true });
}
