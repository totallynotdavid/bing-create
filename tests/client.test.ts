import { describe, test, expect } from "bun:test";
import { createImages } from "../src/client.ts";

describe("createImages validation", () => {
  test("throws on empty prompt", () => {
    return expect(createImages("", { cookie: "valid_cookie" }))
      .rejects.toThrow("Prompt must be a non-empty string");
  });

  test("throws on whitespace-only prompt", () => {
    return expect(createImages("   ", { cookie: "valid_cookie" }))
      .rejects.toThrow("Prompt must be a non-empty string");
  });

  test("throws on empty cookie", () => {
    return expect(createImages("test prompt", { cookie: "" }))
      .rejects.toThrow("options.cookie is required");
  });

  test("throws on whitespace-only cookie", () => {
    return expect(createImages("test prompt", { cookie: "   " }))
      .rejects.toThrow("options.cookie is required");
  });
});
