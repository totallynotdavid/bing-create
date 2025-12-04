import { describe, test, expect } from "bun:test";
import { extractRequestId, extractImageUrls } from "../src/parse.ts";

describe("extractRequestId", () => {
  test("extracts ID from redirect URL", () => {
    const redirectUrl =
      "/images/create?q=a%20simple%20red%20circle%20on%20white%20background&rt=4&mdl=0&ar=1&FORM=GENCRE&id=1-6931be365bf040cabbae8cb6cf435a0a";
    expect(extractRequestId(redirectUrl)).toBe(
      "1-6931be365bf040cabbae8cb6cf435a0a",
    );
  });

  test("extracts ID when id is first param", () => {
    const url = "/images/create?id=abc123&q=test";
    expect(extractRequestId(url)).toBe("abc123");
  });

  test("throws when no id param", () => {
    expect(() => extractRequestId("/images/create?q=test")).toThrow(
      "Failed to extract request ID",
    );
  });

  test("throws on empty id value", () => {
    expect(() => extractRequestId("/images/create?id=&q=test")).toThrow(
      "Failed to extract request ID",
    );
  });
});

describe("extractImageUrls", () => {
  const realDalle3Html = `<img class="image-row-img mimg" src="https://tse3.mm.bing.net/th/id/OIG4.HfM5lIwyCttDOzJbyOCW?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn" alt="Image 1"/><img class="image-row-img mimg" src="https://tse4.mm.bing.net/th/id/OIG4.KlXYym2JqxlbBaa398Dm?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn" alt="Image 2"/><img class="image-row-img mimg" src="https://tse3.mm.bing.net/th/id/OIG4.t3zhkpucTDOhAvlOwhpo?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn" alt="Image 3"/><img class="image-row-img mimg" src="https://tse1.mm.bing.net/th/id/OIG4.3x_XtWuqP68T7JRwKQm9?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn" alt="Image 4"/>`;

  test("extracts 4 URLs from DALL-E 3 response", () => {
    const urls = extractImageUrls(realDalle3Html);
    expect(urls).toHaveLength(4);
  });

  test("normalizes CDN URLs to www.bing.com", () => {
    const urls = extractImageUrls(realDalle3Html);
    for (const url of urls) {
      expect(url).toStartWith("https://www.bing.com/th/id/");
      expect(url).not.toContain("tse");
      expect(url).not.toContain("mm.bing.net");
    }
  });

  test("strips extra query params, keeps only pid", () => {
    const urls = extractImageUrls(realDalle3Html);
    for (const url of urls) {
      expect(url).toContain("?pid=ImgGn");
      expect(url).not.toContain("&w=");
      expect(url).not.toContain("&h=");
    }
  });

  test("decodes HTML entities in URLs", () => {
    const html = `<img src="https://tse1.mm.bing.net/th/id/OIG4.test?w=270&amp;pid=ImgGn"/>`;
    const urls = extractImageUrls(html);
    expect(urls[0]).toBe("https://www.bing.com/th/id/OIG4.test?pid=ImgGn");
  });

  test("handles relative /th/id/ URLs", () => {
    const html = `<img src="/th/id/OIG4.relative?pid=ImgGn"/>`;
    const urls = extractImageUrls(html);
    expect(urls[0]).toBe("https://www.bing.com/th/id/OIG4.relative?pid=ImgGn");
  });

  test("deduplicates identical URLs", () => {
    const html = `<img src="https://tse1.mm.bing.net/th/id/OIG4.same?pid=ImgGn"/><img src="https://tse1.mm.bing.net/th/id/OIG4.same?pid=ImgGn"/>`;
    const urls = extractImageUrls(html);
    expect(urls).toHaveLength(1);
  });

  test("filters out .js URLs", () => {
    const html = `<img src="https://r.bing.com/rp/script.br.js"/><img src="https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn"/>`;
    const urls = extractImageUrls(html);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("OIG4.real");
  });

  test("filters out .svg URLs", () => {
    const html = `<img src="https://r.bing.com/icon.svg"/><img src="https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn"/>`;
    const urls = extractImageUrls(html);
    expect(urls).toHaveLength(1);
  });

  test("throws when no valid images found", () => {
    expect(() => extractImageUrls("<div>no images</div>")).toThrow(
      "No images found",
    );
  });

  test("throws on empty HTML", () => {
    expect(() => extractImageUrls("")).toThrow("No images found");
  });

  test("adds pid=ImgGn when missing", () => {
    const html = `<img src="https://www.bing.com/th/id/OIG4.nopid"/>`;
    const urls = extractImageUrls(html);
    expect(urls[0]).toBe("https://www.bing.com/th/id/OIG4.nopid?pid=ImgGn");
  });
});
