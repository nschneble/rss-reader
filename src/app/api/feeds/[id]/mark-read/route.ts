import { NextResponse } from "next/server";
import { markFeedRead } from "@/lib/db/queries";
import { route, requireId, type RouteContext } from "@/lib/api/http";

export const runtime = "nodejs";

export const POST = route<RouteContext>(async (_req, ctx) => {
  const id = await requireId(ctx);
  markFeedRead(id);
  return NextResponse.json({ ok: true });
});
