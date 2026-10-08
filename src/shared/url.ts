/** True for https URLs on bing.com or any of its subdomains. */
export function isBingUrl(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    (url.hostname === "bing.com" || url.hostname.endsWith(".bing.com"))
  );
}
