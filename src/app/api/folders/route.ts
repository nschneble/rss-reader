import { NextResponse } from "next/server";
import { createFolder, listFolders } from "@/lib/db/queries";
import { route, readBody, bad, ApiError } from "@/lib/api/http";

export const runtime = "nodejs";

export const GET = route(async () => {
  return NextResponse.json({ folders: listFolders() });
});

export const POST = route(async (req) => {
  const body = await readBody<{ name?: string }>(req);
  const name = body.name?.trim();
  if (!name) bad("name required");
  try {
    const folder = createFolder(name);
    return NextResponse.json({ folder });
  } catch (e) {
    // Most likely the unique-name constraint — treat as a conflict.
    throw new ApiError(409, e instanceof Error ? e.message : String(e));
  }
});
