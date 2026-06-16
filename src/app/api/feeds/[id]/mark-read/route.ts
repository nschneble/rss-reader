import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { markFeedRead } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const feedId = Number(id);
  if (!Number.isInteger(feedId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  markFeedRead(feedId);
  return NextResponse.json({ ok: true });
}
