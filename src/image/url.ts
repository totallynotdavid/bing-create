import { isBingUrl } from "../shared/url.ts";

export function normalizeUrls(rawUrls: string[]): string[] {
  return [
    ...new Set(
      rawUrls.map(decodeHtmlEntities).map(normalizeUrl).filter(isImageUrl),
    ),
  ];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function normalizeUrl(url: string): string {
  if (url.startsWith("/th/id/")) {
    url = `https://www.bing.com${url}`;
  }

  // CDN URLs (tse*.mm.bing.net) sometimes 403, use www.bing.com instead
  if (url.includes(".mm.bing.net/th/id/")) {
    url = url.replace(
      /https:\/\/tse\d+\.mm\.bing\.net\/th\/id\//,
      "https://www.bing.com/th/id/",
    );
  }

  // Strip all query params except pid (the only one that matters)
  if (url.includes("?")) {
    const [base, query] = url.split("?");
    if (!base) return url;

    const params = new URLSearchParams(query || "");
    const pid = params.get("pid");
    return pid ? `${base}?pid=${pid}` : `${base}?pid=ImgGn`;
  }

  return `${url}?pid=ImgGn`;
}

function isImageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const path = parsed.pathname.toLowerCase();

  if (path.endsWith(".js") || path.endsWith(".svg")) return false;

  return isBingUrl(parsed) && path.startsWith("/th/id/");
}
