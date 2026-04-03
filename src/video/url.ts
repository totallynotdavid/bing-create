export function normalizeVideoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (/^tse\d+\.mm\.bing\.net$/i.test(parsed.hostname)) {
      parsed.hostname = "th.bing.com";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isSolidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pid = parsed.searchParams.get("pid")?.toLowerCase();
    if (pid !== "videocreator") {
      return false;
    }

    for (const param of ["w", "h", "c", "rs", "qlt", "o"]) {
      if (parsed.searchParams.has(param)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
