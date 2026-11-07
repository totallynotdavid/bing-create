import { request } from "./http.ts";

function extractRequestId(redirectUrl: string): string {
  const match = redirectUrl.match(/[?&]id=([^&]+)/);
  if (!match?.[1]) {
    throw new Error(`Failed to extract request ID from: ${redirectUrl}`);
  }
  return match[1];
}

export async function startGeneration(
  url: string,
  cookie: string,
  timeoutMs: number,
): Promise<string> {
  const redirectUrl = await request(
    url,
    cookie,
    timeoutMs,
    "POST",
    async (response) => {
      await response.body?.cancel();
      return response.headers.get("location");
    },
  );
  if (!redirectUrl) {
    throw new Error("No redirect from Bing. Cookie may be invalid or expired.");
  }

  return extractRequestId(redirectUrl);
}
