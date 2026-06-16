import { NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";
import { listFeedsWithCounts, listFolders } from "@/lib/db/queries";
import { buildOpml } from "@/lib/opml/opml";

export const runtime = "nodejs";

export async function GET() {
  ensureMigrated();
  const feeds = listFeedsWithCounts();
  const folders = listFolders();
  const xml = buildOpml(
    feeds.map((f) => ({
      title: f.title,
      url: f.url,
      siteUrl: f.siteUrl,
      folderId: f.folderId,
    })),
    folders,
  );
  return new NextResponse(xml, {
    headers: {
      "content-type": "text/xml; charset=utf-8",
      "content-disposition": `attachment; filename="subscriptions.opml"`,
    },
  });
}
