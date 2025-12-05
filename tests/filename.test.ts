import { describe, test, expect } from "bun:test";
import { generateFilename } from "../src/filename.ts";

describe("generateFilename", () => {
  test("converts prompt to lowercase slug", () => {
    expect(generateFilename("A Simple Red Circle", 0)).toBe("a-simple-red-circle_0.jpg");
  });

  test("replaces non-alphanumeric chars with hyphens", () => {
    expect(generateFilename("hello! @world# $test%", 1)).toBe("hello-world-test_1.jpg");
  });

  test("collapses consecutive special chars into single hyphen", () => {
    expect(generateFilename("hello---world", 0)).toBe("hello-world_0.jpg");
    expect(generateFilename("hello   world", 0)).toBe("hello-world_0.jpg");
  });

  test("removes leading and trailing hyphens", () => {
    expect(generateFilename("---hello---", 0)).toBe("hello_0.jpg");
    expect(generateFilename("!!!hello!!!", 0)).toBe("hello_0.jpg");
  });

  test("truncates slug to 50 chars", () => {
    const longPrompt = "this is a very long prompt that should be truncated because it exceeds fifty characters";
    const filename = generateFilename(longPrompt, 0);
    const slug = filename.replace(/_\d+\.jpg$/, "");

    expect(slug.length).toBeLessThanOrEqual(50);
    expect(filename).toBe("this-is-a-very-long-prompt-that-should-be-truncate_0.jpg");
  });

  test("handles empty or whitespace prompts", () => {
    expect(generateFilename("", 0)).toBe("_0.jpg");
    expect(generateFilename("   ", 0)).toBe("_0.jpg");
    expect(generateFilename("---", 0)).toBe("_0.jpg");
  });

  test("preserves numbers in slug", () => {
    expect(generateFilename("image 123 test", 0)).toBe("image-123-test_0.jpg");
    expect(generateFilename("123", 0)).toBe("123_0.jpg");
  });
});
