export function extractRequestId(redirectUrl: string): string {
  const match = redirectUrl.match(/[?&]id=([^&]+)/);
  if (!match?.[1]) {
    throw new Error(`Failed to extract request ID from: ${redirectUrl}`);
  }
  return match[1];
}

export function extractImageUrls(html: string): string[] {
  const srcPattern = /src="([^"]+)"/g;
  const urls = [...html.matchAll(srcPattern)]
    .map((match) => match[1])
    .filter((url): url is string => url !== undefined);

  if (urls.length === 0) {
    throw new Error("No images found in response");
  }

  return urls;
}
