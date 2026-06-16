import Parser from "rss-parser";
import { extractSummary, sanitizeContent } from "./sanitize";

export type ParsedFeed = {
  title: string;
  siteUrl: string | null;
  description: string | null;
  iconUrl: string | null;
  items: ParsedItem[];
};

export type ParsedItem = {
  guid: string;
  title: string;
  url: string | null;
  author: string | null;
  content: string;
  summary: string;
  publishedAt: Date | null;
};

type CustomItem = {
  "content:encoded"?: string;
  "dc:creator"?: string;
  author?: string;
  id?: string;
};

const parser: Parser<Record<string, unknown>, CustomItem> = new Parser({
  customFields: {
    item: ["content:encoded", "dc:creator"],
  },
  headers: {
    "User-Agent": "RSS Reader/0.1 (https://github.com/nschneble/rss-reader)",
  },
  timeout: 15_000,
});

function pickGuid(item: Parser.Item & { id?: string }): string {
  return (
    item.guid ||
    item.id ||
    item.link ||
    `${item.title ?? ""}|${item.isoDate ?? item.pubDate ?? ""}`
  );
}

function pickContent(item: Parser.Item & CustomItem): string {
  return (
    item["content:encoded"] ||
    item.content ||
    item.contentSnippet ||
    item.summary ||
    ""
  );
}

function pickFavicon(siteUrl: string | undefined | null): string | null {
  if (!siteUrl) return null;
  try {
    const u = new URL(siteUrl);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return null;
  }
}

export async function fetchAndParseFeed(url: string): Promise<ParsedFeed> {
  const parsed = await parser.parseURL(url);
  const siteUrl = parsed.link ?? null;
  return {
    title: parsed.title?.trim() || siteUrl || url,
    siteUrl,
    description: parsed.description?.trim() ?? null,
    iconUrl: pickFavicon(siteUrl),
    items: (parsed.items || []).map((raw) => {
      const item = raw as Parser.Item & CustomItem;
      const rawContent = pickContent(item);
      return {
        guid: pickGuid(item),
        title: (item.title || "(untitled)").trim(),
        url: item.link ?? null,
        author: item.creator || item["dc:creator"] || item.author || null,
        content: sanitizeContent(rawContent),
        summary: extractSummary(rawContent),
        publishedAt: item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : null,
      };
    }),
  };
}
