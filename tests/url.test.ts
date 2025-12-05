import { describe, test, expect } from "bun:test";
import { normalizeUrls } from "../src/url.ts";

describe("normalizeUrls", () => {
  test("converts CDN URLs to www.bing.com", () => {
    const raw = [
      "https://tse3.mm.bing.net/th/id/OIG4.test?pid=ImgGn",
      "https://tse1.mm.bing.net/th/id/OIG4.test2?pid=ImgGn",
    ];
    const normalized = normalizeUrls(raw);

    expect(normalized).toHaveLength(2);
    for (const url of normalized) {
      expect(url).toStartWith("https://www.bing.com/th/id/");
      expect(url).not.toContain("tse");
    }
  });

  test("strips extra query params, keeps only pid", () => {
    const raw = ["https://tse3.mm.bing.net/th/id/OIG4.test?w=270&h=270&c=6&r=0&o=5&pid=ImgGn"];
    const normalized = normalizeUrls(raw);

    expect(normalized[0]).toBe("https://www.bing.com/th/id/OIG4.test?pid=ImgGn");
  });

  test("decodes HTML entities", () => {
    const raw = ["https://tse1.mm.bing.net/th/id/OIG4.test?w=270&amp;pid=ImgGn"];
    const normalized = normalizeUrls(raw);

    expect(normalized[0]).not.toContain("&amp;");
    expect(normalized[0]).toContain("?pid=ImgGn");
  });

  test("converts relative URLs to absolute", () => {
    const raw = ["/th/id/OIG4.relative?pid=ImgGn"];
    const normalized = normalizeUrls(raw);

    expect(normalized[0]).toBe("https://www.bing.com/th/id/OIG4.relative?pid=ImgGn");
  });

  test("adds pid=ImgGn when missing", () => {
    const raw = ["https://www.bing.com/th/id/OIG4.nopid"];
    const normalized = normalizeUrls(raw);

    expect(normalized[0]).toBe("https://www.bing.com/th/id/OIG4.nopid?pid=ImgGn");
  });

  test("deduplicates identical URLs", () => {
    const raw = [
      "https://tse1.mm.bing.net/th/id/OIG4.same?pid=ImgGn",
      "https://tse1.mm.bing.net/th/id/OIG4.same?pid=ImgGn",
    ];
    const normalized = normalizeUrls(raw);

    expect(normalized).toHaveLength(1);
  });

  test("filters out .js files", () => {
    const raw = [
      "https://r.bing.com/script.js",
      "https://r.bing.com/script.br.js",
      "https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn",
    ];
    const normalized = normalizeUrls(raw);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toContain("OIG4.real");
  });

  test("filters out .svg files", () => {
    const raw = [
      "https://www.bing.com/icon.svg",
      "https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn",
    ];
    const normalized = normalizeUrls(raw);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toContain("OIG4.real");
  });

  test("handles DALL-E 3 URLs end-to-end", () => {
    const raw = [
      "https://tse3.mm.bing.net/th/id/OIG4.HfM5lIwyCttDOzJbyOCW?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn",
      "https://tse4.mm.bing.net/th/id/OIG4.KlXYym2JqxlbBaa398Dm?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn",
    ];
    const normalized = normalizeUrls(raw);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toBe("https://www.bing.com/th/id/OIG4.HfM5lIwyCttDOzJbyOCW?pid=ImgGn");
    expect(normalized[1]).toBe("https://www.bing.com/th/id/OIG4.KlXYym2JqxlbBaa398Dm?pid=ImgGn");
  });
});
