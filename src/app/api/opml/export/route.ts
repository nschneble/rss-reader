import { NextResponse } from "next/server";
import { listFeedsWithCounts, listFolders } from "@/lib/db/queries";
import { buildOpml } from "@/lib/opml/opml";
import { route } from "@/lib/api/http";

export const runtime = "nodejs";

export const GET = route(async () => {
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
});
