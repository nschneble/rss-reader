import type { FeedDTO, FolderDTO } from "../api-client";

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function buildOpml(
  feeds: Pick<FeedDTO, "title" | "url" | "siteUrl" | "folderId">[],
  folders: Pick<FolderDTO, "id" | "name">[],
): string {
  const folderMap = new Map<number, typeof folders[number]>(
    folders.map((f) => [f.id, f]),
  );
  const grouped = new Map<number | "none", typeof feeds>();
  for (const f of feeds) {
    // A feed whose folderId no longer maps to a folder (e.g. the folder was
    // deleted) is treated as unfiled so it still appears in the export.
    const key: number | "none" =
      f.folderId != null && folderMap.has(f.folderId) ? f.folderId : "none";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<opml version="2.0">');
  lines.push("  <head>");
  lines.push("    <title>RSS Reader Subscriptions</title>");
  lines.push(`    <dateCreated>${new Date().toUTCString()}</dateCreated>`);
  lines.push("  </head>");
  lines.push("  <body>");

  for (const [key, group] of grouped) {
    if (key === "none") continue;
    const folder = folderMap.get(key as number);
    if (!folder) continue;
    lines.push(`    <outline text="${escapeXml(folder.name)}" title="${escapeXml(folder.name)}">`);
    for (const feed of group) {
      lines.push(
        `      <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}"${feed.siteUrl ? ` htmlUrl="${escapeXml(feed.siteUrl)}"` : ""}/>`,
      );
    }
    lines.push("    </outline>");
  }
  const unfiled = grouped.get("none") ?? [];
  for (const feed of unfiled) {
    lines.push(
      `    <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}"${feed.siteUrl ? ` htmlUrl="${escapeXml(feed.siteUrl)}"` : ""}/>`,
    );
  }

  lines.push("  </body>");
  lines.push("</opml>");
  return lines.join("\n");
}

export type ParsedOutline = {
  title: string;
  xmlUrl: string;
  htmlUrl?: string | null;
  folder?: string | null;
};

export function parseOpml(xml: string): ParsedOutline[] {
  // Lightweight parser: extracts outline xmlUrl entries.
  const outlines: ParsedOutline[] = [];
  const folderStack: string[] = [];
  // Tokenize on outline tags. Handles nested folders (no xmlUrl) and feed outlines (with xmlUrl).
  const tagRe = /<outline\b([^>]*?)(\/)?>|<\/outline>/g;
  const attrRe = /(\w+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(xml)) !== null) {
    if (m[0].startsWith("</")) {
      folderStack.pop();
      continue;
    }
    const attrsStr = m[1] || "";
    const attrs: Record<string, string> = {};
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(attrsStr)) !== null) {
      attrs[am[1]] = decodeEntities(am[2]);
    }
    attrRe.lastIndex = 0;
    const selfClosing = !!m[2];
    if (attrs.xmlUrl) {
      outlines.push({
        title: attrs.title || attrs.text || attrs.xmlUrl,
        xmlUrl: attrs.xmlUrl,
        htmlUrl: attrs.htmlUrl ?? null,
        folder: folderStack[folderStack.length - 1] ?? null,
      });
    } else if (!selfClosing) {
      folderStack.push(attrs.title || attrs.text || "Imported");
    }
  }
  return outlines;
}

function decodeEntities(s: string): string {
  // &amp; must be decoded LAST, otherwise an input like "&amp;lt;" would first
  // become "&lt;" and then wrongly decode to "<" (double-decode).
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
