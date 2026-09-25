import { describe, test, expect } from "bun:test";
import { extractVideoUrl, isPendingMessage } from "../src/video/parse.ts";

describe("extractVideoUrl", () => {
  test("extracts URL from ourl attribute", () => {
    const html = '<div class="vidgn" ourl="https://th.bing.com/th/id/OVID.abc?pid=videocreator"></div>';
    expect(extractVideoUrl(html)).toBe("https://th.bing.com/th/id/OVID.abc?pid=videocreator");
  });

  test("unescapes backslash-escaped slashes", () => {
    const html = 'ourl="https:\\/\\/th.bing.com\\/th\\/id\\/OVID.abc?pid=videocreator"';
    expect(extractVideoUrl(html)).toBe("https://th.bing.com/th/id/OVID.abc?pid=videocreator");
  });

  test("unescapes \\u0026 to an ampersand", () => {
    const html = 'ourl="https://th.bing.com/th/id/OVID.abc?a=1\\u0026pid=videocreator"';
    expect(extractVideoUrl(html)).toBe("https://th.bing.com/th/id/OVID.abc?a=1&pid=videocreator");
  });

  test("decodes HTML entities", () => {
    const html = 'ourl="https://th.bing.com/th/id/OVID.abc?a=1&amp;pid=videocreator"';
    expect(extractVideoUrl(html)).toBe("https://th.bing.com/th/id/OVID.abc?a=1&pid=videocreator");
  });

  test("does not double-unescape &amp; combined with \\u0026 (regression)", () => {
    // Mirrors what Bing serves when an already-entity-escaped ampersand is
    // itself wrapped in a backslash-u0026 unicode escape. Unescaping that
    // escape before &amp; would collapse "&amp;" down to a bare "&", losing
    // a layer of escaping that was never actually double-encoded.
    const html = 'ourl="https://th.bing.com/th/id/OVID.dbl?x=1\\u0026amp;y=2\\u0026pid=videocreator"';
    expect(extractVideoUrl(html)).toBe(
      "https://th.bing.com/th/id/OVID.dbl?x=1&amp;y=2&pid=videocreator",
    );
  });

  test("normalizes CDN hostname of matched URL", () => {
    const html = 'ourl="https://tse4.mm.bing.net/th/id/OVID.abc?pid=videocreator"';
    expect(extractVideoUrl(html)).toBe("https://th.bing.com/th/id/OVID.abc?pid=videocreator");
  });

  test("returns null when no solid video URL is present", () => {
    expect(extractVideoUrl('ourl="https://th.bing.com/th/id/OVID.abc?pid=ImgGn"')).toBeNull();
    expect(extractVideoUrl('ourl="https://th.bing.com/th/id/OVID.abc?w=100&pid=videocreator"')).toBeNull();
  });

  test("returns null on empty input", () => {
    expect(extractVideoUrl("")).toBeNull();
  });

  test("returns null when no ourl attribute is found", () => {
    expect(extractVideoUrl("<div>still generating</div>")).toBeNull();
  });
});

describe("isPendingMessage", () => {
  test("matches 'pending' case-insensitively with surrounding whitespace", () => {
    expect(isPendingMessage("pending")).toBe(true);
    expect(isPendingMessage("Pending")).toBe(true);
    expect(isPendingMessage("  PENDING  ")).toBe(true);
  });

  test("matches 'still pending' case-insensitively with surrounding whitespace", () => {
    expect(isPendingMessage("still pending")).toBe(true);
    expect(isPendingMessage("  Still Pending  ")).toBe(true);
  });

  test("does not match other messages", () => {
    expect(isPendingMessage("error: bad request")).toBe(false);
    expect(isPendingMessage("")).toBe(false);
  });
});
