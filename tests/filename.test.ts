import { test, expect } from "bun:test";
import { generateFilename } from "../src/image/filename.ts";

test.each([
  ["A Simple Red Circle", 0, "a-simple-red-circle_0.jpg"],
  ["hello! @world# $test%", 1, "hello-world-test_1.jpg"],
  ["hello---world   again", 0, "hello-world-again_0.jpg"],
  ["---hello---", 0, "hello_0.jpg"],
  ["image 123 test", 0, "image-123-test_0.jpg"],
  [
    "this is a very long prompt that should be truncated because it exceeds fifty characters",
    0,
    "this-is-a-very-long-prompt-that-should-be-truncate_0.jpg",
  ],
  ["", 0, "_0.jpg"],
  ["---", 0, "_0.jpg"],
])("generateFilename(%p, %p) is %p", (prompt, index, expected) => {
  expect(generateFilename(prompt, index)).toBe(expected);
});

test("generateFilename handles a long run of hyphens", () => {
  expect(generateFilename(`${"-".repeat(100_000)}image`, 0)).toBe(
    "image_0.jpg",
  );
});
