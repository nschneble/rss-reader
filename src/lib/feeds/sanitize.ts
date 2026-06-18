import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "a", "strong", "em", "b", "i", "u", "s", "code", "pre",
  "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "img", "figure", "figcaption", "video", "audio", "source", "iframe",
  "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "div",
];

const ALLOWED_ATTRS = {
  a: ["href", "name", "target", "rel", "title"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
  video: ["src", "controls", "poster", "width", "height"],
  audio: ["src", "controls"],
  source: ["src", "type"],
  "*": ["class"],
};

export function sanitizeContent(html: string | undefined | null): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    // No "data:" — data URIs in feed content are an XSS / payload-smuggling
    // vector (e.g. data:text/html). Images load over http(s) only.
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com", "vimeo.com"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
  });
}

export function extractSummary(html: string | undefined | null, maxLen = 240): string {
  if (!html) return "";
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}
