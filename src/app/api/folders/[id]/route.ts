import { NextResponse } from "next/server";
import { deleteFolder, renameFolder } from "@/lib/db/queries";
import { route, requireId, readBody, bad, type RouteContext } from "@/lib/api/http";

export const runtime = "nodejs";

export const PATCH = route<RouteContext>(async (req, ctx) => {
  const id = await requireId(ctx);
  const body = await readBody<{ name?: string }>(req);
  const name = body.name?.trim();
  if (!name) bad("name required");
  const folder = renameFolder(id, name);
  return NextResponse.json({ folder });
});

export const DELETE = route<RouteContext>(async (_req, ctx) => {
  const id = await requireId(ctx);
  deleteFolder(id);
  return NextResponse.json({ ok: true });
});
