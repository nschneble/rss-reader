import { NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { markAllRead } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST() {
  ensureMigrated();
  markAllRead();
  return NextResponse.json({ ok: true });
}
