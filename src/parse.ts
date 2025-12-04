export function extractRequestId(redirectUrl: string): string {
  const match = redirectUrl.match(/[?&]id=([^&]+)/);
  if (!match?.[1]) {
    throw new Error(`Failed to extract request ID from URL: ${redirectUrl}`);
  }
  return match[1];
}

export function extractImageUrls(html: string): string[] {
  const srcPattern = /src="([^"]+)"/g;
  const matches = [...html.matchAll(srcPattern)];

  const urls = matches
    .map((match) => match[1])
    .filter((url): url is string => url !== undefined)
    .map(decodeHtmlEntities)
    .map(normalizeImageUrl)
    .filter(isValidImageUrl);

  const uniqueUrls = [...new Set(urls)];

  if (uniqueUrls.length === 0) {
    throw new Error("No images found in response");
  }

  return uniqueUrls;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeImageUrl(url: string): string {
  if (url.startsWith("/th/id/")) {
    url = `https://www.bing.com${url}`;
  }

  if (url.includes("tse") && url.includes(".mm.bing.net/th/id/")) {
    url = url.replace(
      /https:\/\/tse\d+\.mm\.bing\.net\/th\/id\//,
      "https://www.bing.com/th/id/",
    );
  }

  if (url.includes("th/id/") && !url.includes("pid=")) {
    const base = url.split("?")[0];
    return `${base}?pid=ImgGn`;
  }

  if (url.includes("?")) {
    const [base, query] = url.split("?");
    if (!base || !query) return url;

    const params = new URLSearchParams(query);
    const pid = params.get("pid");
    return pid ? `${base}?pid=${pid}` : base;
  }

  return url;
}

function isValidImageUrl(url: string): boolean {
  const lower = url.toLowerCase();

  if (lower.endsWith(".js") || lower.includes(".br.js")) return false;
  if (lower.endsWith(".svg")) return false;

  return lower.includes("bing.com/th/id/");
}
