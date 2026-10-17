import { describe, test, expect } from "bun:test";
import { normalizeVideoUrl, isSolidVideoUrl } from "../src/video/url.ts";

const solid = "https://th.bing.com/th/id/OVID.test?pid=videocreator";

describe("normalizeVideoUrl", () => {
  test.each([
    ["https://tse3.mm.bing.net/th/id/OVID.test?pid=videocreator", solid],
    [solid, solid],
    ["not a url", "not a url"],
  ])("normalizes %s", (url, expected) => {
    expect(normalizeVideoUrl(url)).toBe(expected);
  });
});

describe("isSolidVideoUrl", () => {
  test.each([
    solid,
    "https://th.bing.com/th/id/OVID.test?pid=VideoCreator",
    "https://www.bing.com/th/id/OVID.x?pid=videocreator",
    "https://bing.com/th/id/OVID.x?pid=videocreator",
  ])("accepts %s", (url) => {
    expect(isSolidVideoUrl(url)).toBe(true);
  });

  test.each([
    "https://th.bing.com/th/id/OVID.test",
    "https://th.bing.com/th/id/OVID.test?pid=ImgGn",
    ...["w", "h", "c", "rs", "qlt", "o"].map(
      (param) =>
        `https://th.bing.com/th/id/OVID.test?${param}=1&pid=videocreator`,
    ),
    "https://example.com/?pid=videocreator",
    "https://evilbing.com/th/id/OVID.x?pid=videocreator",
    "https://th.bing.com.evil.test/th/id/OVID.x?pid=videocreator",
    "http://th.bing.com/th/id/OVID.x?pid=videocreator",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isSolidVideoUrl(url)).toBe(false);
  });
});
