import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the network boundary; parse.ts still runs the real rss-parser on the XML.
const fetchMock = vi.fn<(url: string) => Promise<string>>();
vi.mock("./safe-fetch", () => ({
  safeFetchFeed: (url: string) => fetchMock(url),
}));

import { fetchAndParseFeed } from "./parse";

function rss(items: string, channel = "") {
  return `<?xml version="1.0"?><rss version="2.0"><channel>
    <title>Feed</title><link>https://site.example</link>${channel}
    ${items}</channel></rss>`;
}

beforeEach(() => fetchMock.mockReset());

describe("fetchAndParseFeed", () => {
  it("derives favicon from the site link", async () => {
    fetchMock.mockResolvedValue(rss(""));
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.iconUrl).toBe("https://site.example/favicon.ico");
    expect(feed.siteUrl).toBe("https://site.example");
  });

  it("returns publishedAt null for an unparseable date (regression)", async () => {
    fetchMock.mockResolvedValue(
      rss(`<item><title>X</title><guid>g1</guid><pubDate>not-a-date</pubDate></item>`),
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items[0].publishedAt).toBeNull();
  });

  it("parses a valid date", async () => {
    fetchMock.mockResolvedValue(
      rss(`<item><title>X</title><guid>g1</guid><pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate></item>`),
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items[0].publishedAt?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("prefers content:encoded for content", async () => {
    fetchMock.mockResolvedValue(
      rss(
        `<item><title>X</title><guid>g1</guid>` +
          `<description>short</description>` +
          `<content:encoded><![CDATA[<p>rich body</p>]]></content:encoded></item>`,
      ),
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items[0].content).toContain("rich body");
  });

  it("falls back to link for guid when none provided", async () => {
    fetchMock.mockResolvedValue(
      rss(`<item><title>X</title><link>https://site.example/post-1</link></item>`),
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items[0].guid).toBe("https://site.example/post-1");
  });

  it("returns an empty items array for a feed with no entries", async () => {
    fetchMock.mockResolvedValue(rss(""));
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items).toEqual([]);
  });

  it("drops an item link with an unsafe scheme (javascript: XSS)", async () => {
    fetchMock.mockResolvedValue(
      rss(`<item><title>X</title><guid>g1</guid><link>javascript:alert(1)</link></item>`),
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items[0].url).toBeNull();
  });

  it("drops the favicon when the site link has an unsafe scheme", async () => {
    fetchMock.mockResolvedValue(
      `<?xml version="1.0"?><rss version="2.0"><channel>
        <title>Feed</title><link>javascript:alert(1)</link></channel></rss>`,
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.iconUrl).toBeNull();
  });

  it("keeps an item link with a safe http/https scheme", async () => {
    fetchMock.mockResolvedValue(
      rss(`<item><title>X</title><guid>g1</guid><link>https://site.example/post-1</link></item>`),
    );
    const feed = await fetchAndParseFeed("https://site.example/feed");
    expect(feed.items[0].url).toBe("https://site.example/post-1");
  });
});
