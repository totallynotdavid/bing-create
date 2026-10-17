import { describe, test, expect } from "bun:test";
import { extractVideoUrl, isPendingMessage } from "../src/video/parse.ts";

const base = "https://th.bing.com/th/id/OVID.abc";

describe("extractVideoUrl", () => {
  test.each([
    [
      "an ourl attribute",
      `<div class="vidgn" ourl="${base}?pid=videocreator"></div>`,
      `${base}?pid=videocreator`,
    ],
    [
      "backslash-escaped slashes",
      'ourl="https:\\/\\/th.bing.com\\/th\\/id\\/OVID.abc?pid=videocreator"',
      `${base}?pid=videocreator`,
    ],
    [
      "a \\u0026 escape",
      `ourl="${base}?a=1\\u0026pid=videocreator"`,
      `${base}?a=1&pid=videocreator`,
    ],
    [
      "HTML entities",
      `ourl="${base}?a=1&amp;pid=videocreator"`,
      `${base}?a=1&pid=videocreator`,
    ],
    [
      "an entity inside an already escaped ampersand, decoded once",
      `ourl="${base}?x=1\\u0026amp;y=2\\u0026pid=videocreator"`,
      `${base}?x=1&amp;y=2&pid=videocreator`,
    ],
    [
      "a nested entity, decoded once",
      `ourl="${base}?x=1&amp;quot;label&amp;pid=videocreator"`,
      `${base}?x=1&quot;label&pid=videocreator`,
    ],
    [
      "uppercase entities, left as they are",
      `ourl="${base}?x=1&AMP;label=2&pid=videocreator"`,
      `${base}?x=1&AMP;label=2&pid=videocreator`,
    ],
    [
      "a CDN host, rewritten to th.bing.com",
      'ourl="https://tse4.mm.bing.net/th/id/OVID.abc?pid=videocreator"',
      `${base}?pid=videocreator`,
    ],
  ])("returns the URL from %s", (_name, text, expected) => {
    expect(extractVideoUrl(text)).toBe(expected);
  });

  test.each([
    ["empty input", ""],
    ["no ourl attribute", "<div>still generating</div>"],
    ["a pid other than videocreator", `ourl="${base}?pid=ImgGn"`],
    ["a thumbnail parameter", `ourl="${base}?w=100&pid=videocreator"`],
  ])("returns null for %s", (_name, text) => {
    expect(extractVideoUrl(text)).toBeNull();
  });
});

describe("isPendingMessage", () => {
  test.each([
    "pending",
    "Pending",
    "  PENDING  ",
    "still pending",
    " Still Pending ",
  ])("matches %p", (message) => {
    expect(isPendingMessage(message)).toBe(true);
  });

  test.each(["error: bad request", ""])("does not match %p", (message) => {
    expect(isPendingMessage(message)).toBe(false);
  });
});
