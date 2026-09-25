import { describe, test, expect } from "bun:test";
import { normalizeVideoUrl, isSolidVideoUrl } from "../src/video/url.ts";

describe("normalizeVideoUrl", () => {
  test("converts CDN URLs to th.bing.com", () => {
    const normalized = normalizeVideoUrl("https://tse3.mm.bing.net/th/id/OVID.test?pid=videocreator");
    expect(normalized).toBe("https://th.bing.com/th/id/OVID.test?pid=videocreator");
  });

  test("leaves non-CDN hostnames untouched", () => {
    const url = "https://th.bing.com/th/id/OVID.test?pid=videocreator";
    expect(normalizeVideoUrl(url)).toBe(url);
  });

  test("returns the input unchanged when it is not a valid URL", () => {
    expect(normalizeVideoUrl("not a url")).toBe("not a url");
  });
});

describe("isSolidVideoUrl", () => {
  test("accepts a URL with only pid=videocreator", () => {
    expect(isSolidVideoUrl("https://th.bing.com/th/id/OVID.test?pid=videocreator")).toBe(true);
  });

  test("matches pid case-insensitively", () => {
    expect(isSolidVideoUrl("https://th.bing.com/th/id/OVID.test?pid=VideoCreator")).toBe(true);
  });

  test("rejects when pid is missing or different", () => {
    expect(isSolidVideoUrl("https://th.bing.com/th/id/OVID.test")).toBe(false);
    expect(isSolidVideoUrl("https://th.bing.com/th/id/OVID.test?pid=ImgGn")).toBe(false);
  });

  test("rejects thumbnail-sized results carrying crop or quality params", () => {
    for (const param of ["w", "h", "c", "rs", "qlt", "o"]) {
      const url = `https://th.bing.com/th/id/OVID.test?${param}=1&pid=videocreator`;
      expect(isSolidVideoUrl(url)).toBe(false);
    }
  });

  test("rejects invalid URLs", () => {
    expect(isSolidVideoUrl("not a url")).toBe(false);
  });
});
