/**
 * Integration tests for the Bing Image Creator API.
 *
 * These tests make real API calls and should only run:
 * - Manually with BING_AUTH_COOKIE set
 * - Weekly in CI via GitHub Actions
 *
 * Run with: BING_AUTH_COOKIE=xxx bun test tests/integration.test.ts
 */

import { describe, test, expect } from "bun:test";
import { createImages } from "../src/client.ts";
import { Model } from "../src/types.ts";

const cookie = process.env["BING_AUTH_COOKIE"];
const shouldRun = !!cookie;

describe.skipIf(!shouldRun)("integration", () => {
  test(
    "createImages returns valid image URLs",
    async () => {
      if (!cookie) {
        throw new Error("BING_AUTH_COOKIE is not set");
      }

      const results = await createImages("a small blue square", {
        cookie: cookie,
        model: Model.DALLE3,
        pollIntervalMs: 2_000,
      });

      // DALL-E 3 should return 4 images
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.length).toBeLessThanOrEqual(4);

      for (const result of results) {
        // URL should be normalized
        expect(result.url).toStartWith("https://www.bing.com/th/id/");
        expect(result.url).toContain("?pid=ImgGn");

        // Filename should be generated
        expect(result.filename).toMatch(/^a_small_blue_square_\d+\.jpg$/);

        // URL should be reachable (HEAD request)
        const response = await fetch(result.url, { method: "HEAD" });
        expect(response.ok).toBe(true);
        expect(response.headers.get("content-type")).toContain("image");
      }
    },
    { timeout: 120_000 },
  );
});
