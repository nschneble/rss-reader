import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { createFolder, listFolders } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  ensureMigrated();
  return NextResponse.json({ folders: listFolders() });
}

export async function POST(req: NextRequest) {
  ensureMigrated();
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const folder = createFolder(name);
    return NextResponse.json({ folder });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
