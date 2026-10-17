import { decodeEscapes } from "../shared/text.ts";
import { normalizeVideoUrl, isSolidVideoUrl } from "./url.ts";

export function extractVideoUrl(text: string): string | null {
  if (!text) {
    return null;
  }

  const decoded = decodeEscapes(text.replace(/\\\//g, "/"));

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
