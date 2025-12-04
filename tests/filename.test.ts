import { describe, test, expect } from "bun:test";
import { generateFilename } from "../src/filename.ts";

describe("generateFilename", () => {
  test("normalizes prompt to a slug", () => {
    const cases: Array<[string, number, string]> = [
      ["a simple red circle", 0, "a_simple_red_circle_0.jpg"],
      ["hello! @world# $test%", 1, "hello_world_test_1.jpg"],
      ["Hello World", 0, "hello_world_0.jpg"],
      ["hello---world", 0, "hello_world_0.jpg"],
      ["  hello  ", 0, "hello_0.jpg"],
      ["!!!test!!!", 0, "test_0.jpg"],
    ];

    for (const [prompt, index, expected] of cases) {
      expect(generateFilename(prompt, index)).toBe(expected);
    }
  });

  test("enforces slug length <= 50 chars (before _index.jpg)", () => {
    const longPrompt =
      "this is a very long prompt that should be truncated because it exceeds fifty characters";

    const filename = generateFilename(longPrompt, 0);
    const slugPart = filename.replace(/_\d+\.jpg$/, "");

    expect(slugPart.length).toBeLessThanOrEqual(50);
  });

  test("appends index to filename", () => {
    const cases: Array<[string, number, string]> = [
      ["test", 0, "test_0.jpg"],
      ["test", 3, "test_3.jpg"],
      ["test", 99, "test_99.jpg"],
    ];

    for (const [prompt, index, expected] of cases) {
      expect(generateFilename(prompt, index)).toBe(expected);
    }
  });
});
