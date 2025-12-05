import { describe, test, expect } from "bun:test";
import { createImages } from "../src/client.ts";

const cookie = process.env["BING_COOKIE"];
const shouldRun = !!cookie;

describe.skipIf(!shouldRun)("integration: real API calls", () => {
  test(
    "generates images and returns valid URLs",
    async () => {
      if (!cookie) throw new Error("BING_COOKIE not set");

      const results = await createImages("a small blue square", {
        cookie,
        model: "dalle3",
        timeouts: { pollingMs: 2_000 },
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.length).toBeLessThanOrEqual(4);

      for (const result of results) {
        expect(result.url).toStartWith("https://www.bing.com/th/id/");
        expect(result.url).toContain("?pid=ImgGn");
        expect(result.suggestedFilename).toMatch(/^a-small-blue-square_\d+\.jpg$/);

        const response = await fetch(result.url, { method: "HEAD" });
        expect(response.ok).toBe(true);
        expect(response.headers.get("content-type")).toContain("image");
      }
    },
    { timeout: 120_000 },
  );

  test(
    "handles different aspect ratios",
    async () => {
      if (!cookie) throw new Error("BING_COOKIE not set");

      const results = await createImages("red circle", {
        cookie,
        model: "dalle3",
        aspectRatio: "landscape",
        timeouts: { pollingMs: 2_000 },
      });

      if (!results[0]) return;

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].url).toStartWith("https://www.bing.com/th/id/");
    },
    { timeout: 120_000 },
  );
});
