import { describe, it, expect } from "vitest";
import { sanitizeContent, extractSummary } from "./sanitize";

describe("sanitizeContent — XSS", () => {
  it("strips <script> tags", () => {
    const out = sanitizeContent('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("<p>hi</p>");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeContent('<img src="https://x/y.png" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });

  it("drops javascript: hrefs", () => {
    const out = sanitizeContent('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("drops data: URIs (not in scheme allowlist)", () => {
    const out = sanitizeContent('<img src="data:text/html,<script>alert(1)</script>">');
    expect(out).not.toContain("data:");
  });

  it("strips <style> blocks", () => {
    const out = sanitizeContent("<style>body{display:none}</style><p>ok</p>");
    expect(out).not.toContain("<style");
    expect(out).toContain("<p>ok</p>");
  });
});

describe("sanitizeContent — allowlists & transforms", () => {
  it("keeps http(s) image src and forces lazy loading", () => {
    const out = sanitizeContent('<img src="https://ex.com/a.png" alt="a">');
    expect(out).toContain('src="https://ex.com/a.png"');
    expect(out).toContain('loading="lazy"');
  });

  it("forces target/rel on links regardless of feed-supplied rel", () => {
    const out = sanitizeContent('<a href="https://ex.com" rel="author">x</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("keeps allowed iframe hostnames", () => {
    const out = sanitizeContent(
      '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
    );
    expect(out).toContain("youtube.com/embed/abc");
  });

  it("drops iframes from disallowed hostnames", () => {
    const out = sanitizeContent('<iframe src="https://evil.com/x"></iframe>');
    expect(out).not.toContain("evil.com");
  });

  it("returns empty string for null/undefined/empty", () => {
    expect(sanitizeContent(null)).toBe("");
    expect(sanitizeContent(undefined)).toBe("");
    expect(sanitizeContent("")).toBe("");
  });
});

describe("extractSummary", () => {
  it("strips all tags and collapses whitespace", () => {
    expect(extractSummary("<p>hello   <b>world</b></p>")).toBe("hello world");
  });

  it("returns full text when under maxLen", () => {
    expect(extractSummary("<p>short</p>", 240)).toBe("short");
  });

  it("truncates with ellipsis when over maxLen", () => {
    const out = extractSummary("<p>" + "a".repeat(300) + "</p>", 10);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(11);
  });

  it("respects a custom maxLen", () => {
    expect(extractSummary("abcdef", 3)).toBe("abc…");
  });

  it("returns empty string for null/undefined", () => {
    expect(extractSummary(null)).toBe("");
    expect(extractSummary(undefined)).toBe("");
  });
});
