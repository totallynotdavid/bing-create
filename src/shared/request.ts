import { fetchWithTimeout } from "./http.ts";

export function extractRequestId(redirectUrl: string): string {
  const match = redirectUrl.match(/[?&]id=([^&]+)/);
  if (!match?.[1]) {
    throw new Error(`Failed to extract request ID from: ${redirectUrl}`);
  }
  return match[1];
}

/** Extracts the request ID from Bing's creation-response redirect URL. */
export async function startGeneration(
  url: string,
  cookie: string,
  timeoutMs: number,
): Promise<string> {
  const response = await fetchWithTimeout(url, cookie, timeoutMs, "POST");

  const redirectUrl = response.headers.get("location");
  if (!redirectUrl) {
    throw new Error("No redirect from Bing. Cookie may be invalid or expired.");
  }

  return extractRequestId(redirectUrl);
}
