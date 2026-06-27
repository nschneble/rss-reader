import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT = "RSS Reader/0.1 (https://github.com/nschneble/rss-reader)";

/**
 * Feed URLs are fully attacker-controlled (manual add + OPML import), and we
 * fetch them from the server. Without these checks a user could point the app
 * at `http://169.254.169.254/` (cloud metadata), `http://localhost:5432`, or
 * any other internal host and use it as an SSRF proxy. We therefore: (1) allow
 * only http/https, (2) resolve every hostname and reject private/reserved IPs,
 * and (3) follow redirects manually so each hop is re-validated (the default
 * fetch redirect handling would silently bounce us to an internal address).
 */

function ipv4ToParts(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

function isPrivateIpv4(ip: string): boolean {
  const p = ipv4ToParts(ip);
  if (!p) return false;
  const [a, b] = p;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIpv6(raw: string): boolean {
  const ip = raw.toLowerCase().split("%")[0]; // strip zone id
  if (ip === "::1" || ip === "::") return true; // loopback / unspecified
  // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4 address
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  if (ip.startsWith("fe80")) return true; // link-local
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // unique local
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateIpv4(ip);
  if (v === 6) return isPrivateIpv6(ip);
  return false;
}

async function assertPublicUrl(url: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`invalid feed URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`unsupported URL scheme: ${parsed.protocol}`);
  }
  const host = parsed.hostname;
  // Literal IP host — check directly without DNS.
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error(`blocked private address: ${host}`);
    return parsed;
  }
  // Resolve all A/AAAA records and reject if ANY maps to a private range.
  const records = await lookup(host, { all: true });
  if (records.length === 0) throw new Error(`could not resolve host: ${host}`);
  for (const { address } of records) {
    if (isPrivateIp(address)) {
      throw new Error(`blocked private address: ${host} -> ${address}`);
    }
  }
  return parsed;
}

/**
 * Fetch a feed document over http/https with SSRF protections. Returns the raw
 * response body as text for parsing with `Parser.parseString`.
 */
export async function safeFetchFeed(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let current = url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicUrl(current);
      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) throw new Error(`redirect with no location from ${current}`);
        current = new URL(location, current).toString();
        continue;
      }
      if (!res.ok) throw new Error(`feed responded ${res.status} ${res.statusText}`);
      const length = Number(res.headers.get("content-length"));
      if (Number.isFinite(length) && length > MAX_BYTES) {
        throw new Error(`feed too large: ${length} bytes`);
      }
      const text = await res.text();
      if (text.length > MAX_BYTES) throw new Error("feed too large");
      return text;
    }
    throw new Error(`too many redirects fetching ${url}`);
  } finally {
    clearTimeout(timeout);
  }
}
