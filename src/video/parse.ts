import { normalizeVideoUrl, isSolidVideoUrl } from "./url.ts";

export function extractVideoUrl(text: string): string | null {
  if (!text) {
    return null;
  }

  const decoded = text
    .replace(/\\\//g, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  for (const match of decoded.matchAll(/\bourl="([^"]+)"/gi)) {
    const rawUrl = match[1]?.trim();
    if (!rawUrl) {
      continue;
    }

    const normalized = normalizeVideoUrl(rawUrl);
    if (isSolidVideoUrl(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function isPendingMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === "pending" || normalized === "still pending";
}
