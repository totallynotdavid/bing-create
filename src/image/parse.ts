import { normalizeUrls } from "./url.ts";

/** Returns normalized image URLs or throws when no usable URL remains. */
export function extractImageUrls(html: string): string[] {
  const srcPattern = /src="([^"]+)"/g;
  const rawUrls = [...html.matchAll(srcPattern)]
    .map((match) => match[1])
    .filter((url): url is string => url !== undefined);

  const urls = normalizeUrls(rawUrls);

  if (urls.length === 0) {
    throw new Error("No images found in response");
  }

  return urls;
}
