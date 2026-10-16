import { normalizeVideoUrl, isSolidVideoUrl } from "./url.ts";

const ESCAPE_REPLACEMENTS: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeEscapeSequence(value: string): string {
  if (value === "\\u0026") {
    return "&";
  }

  return ESCAPE_REPLACEMENTS[value] ?? value;
}

export function extractVideoUrl(text: string): string | null {
  if (!text) {
    return null;
  }

  const decoded = text
    .replace(/\\\//g, "/")
    .replace(/\\u0026|&(?:amp|quot|#39|lt|gt);/g, decodeEscapeSequence);

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
