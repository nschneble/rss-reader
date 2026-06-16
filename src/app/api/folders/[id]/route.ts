import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { deleteFolder, renameFolder } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const folderId = Number(id);
  if (!Number.isInteger(folderId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const folder = renameFolder(folderId, name);
  return NextResponse.json({ folder });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  ensureMigrated();
  const { id } = await ctx.params;
  const folderId = Number(id);
  if (!Number.isInteger(folderId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  deleteFolder(folderId);
  return NextResponse.json({ ok: true });
}
