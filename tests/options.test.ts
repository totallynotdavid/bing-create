import { describe, test, expect } from "bun:test";
import { resolveTimeouts, validate } from "../src/shared/options.ts";

describe("resolveTimeouts", () => {
  test("uses defaults when nothing is given", () => {
    expect(resolveTimeouts()).toEqual({
      generationMs: 300_000,
      pollingMs: 1_000,
      requestMs: 30_000,
    });
  });

  test("overrides only the given fields", () => {
    expect(resolveTimeouts({ pollingMs: 50, requestMs: undefined })).toEqual({
      generationMs: 300_000,
      pollingMs: 50,
      requestMs: 30_000,
    });
  });
});

describe("validate", () => {
  test("accepts a prompt and a cookie", () => {
    expect(() => validate("a cat", "cookie")).not.toThrow();
  });

  test("rejects a blank prompt", () => {
    expect(() => validate(" ", "cookie")).toThrow(
      "Prompt must be a non-empty string",
    );
  });

  test("rejects a blank cookie", () => {
    expect(() => validate("a cat", " ")).toThrow("options.cookie is required");
  });
});
