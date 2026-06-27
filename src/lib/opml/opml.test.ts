import { describe, it, expect } from "vitest";
import { parseOpml, buildOpml } from "./opml";

describe("parseOpml", () => {
  it("parses flat feed outlines", () => {
    const xml = `<opml><body>
      <outline type="rss" text="A" title="A" xmlUrl="https://a.com/feed" htmlUrl="https://a.com"/>
    </body></opml>`;
    const out = parseOpml(xml);
    expect(out).toEqual([
      { title: "A", xmlUrl: "https://a.com/feed", htmlUrl: "https://a.com", folder: null },
    ]);
  });

  it("assigns folder from the enclosing outline", () => {
    const xml = `<opml><body>
      <outline text="News" title="News">
        <outline type="rss" title="A" xmlUrl="https://a.com/feed"/>
      </outline>
    </body></opml>`;
    expect(parseOpml(xml)[0].folder).toBe("News");
  });

  it("falls back title -> text -> xmlUrl", () => {
    const xml = `<opml><body>
      <outline type="rss" text="T" xmlUrl="https://a.com/feed"/>
      <outline type="rss" xmlUrl="https://b.com/feed"/>
    </body></opml>`;
    const out = parseOpml(xml);
    expect(out[0].title).toBe("T");
    expect(out[1].title).toBe("https://b.com/feed");
  });

  it("ignores self-closing outlines without xmlUrl", () => {
    const xml = `<opml><body><outline text="empty"/></body></opml>`;
    expect(parseOpml(xml)).toEqual([]);
  });

  it("returns [] for empty / non-OPML input", () => {
    expect(parseOpml("")).toEqual([]);
    expect(parseOpml("just text")).toEqual([]);
  });

  it("does NOT double-decode entities (regression)", () => {
    // "&amp;lt;" represents the literal text "&lt;", which must NOT become "<".
    const xml = `<opml><body><outline type="rss" title="A &amp;lt; B" xmlUrl="https://a.com/feed"/></body></opml>`;
    expect(parseOpml(xml)[0].title).toBe("A &lt; B");
  });
});

describe("buildOpml", () => {
  it("escapes XML special chars in names", () => {
    const xml = buildOpml(
      [{ title: 'A & <B>', url: "https://a.com/feed", siteUrl: null, folderId: null }],
      [],
    );
    expect(xml).toContain("A &amp; &lt;B&gt;");
  });

  it("groups feeds under their folder", () => {
    const xml = buildOpml(
      [{ title: "A", url: "https://a.com/feed", siteUrl: "https://a.com", folderId: 1 }],
      [{ id: 1, name: "News" }],
    );
    expect(xml).toContain('text="News"');
    expect(xml).toContain('xmlUrl="https://a.com/feed"');
  });

  it("keeps a feed whose folderId no longer maps to a folder (regression)", () => {
    const xml = buildOpml(
      [{ title: "Orphan", url: "https://o.com/feed", siteUrl: null, folderId: 99 }],
      [], // folder 99 deleted
    );
    expect(xml).toContain('xmlUrl="https://o.com/feed"');
  });

  it("round-trips a title containing & < \"", () => {
    const title = 'Tom & "Jerry" <3';
    const xml = buildOpml(
      [{ title, url: "https://a.com/feed", siteUrl: null, folderId: null }],
      [],
    );
    expect(parseOpml(xml)[0].title).toBe(title);
  });
});
