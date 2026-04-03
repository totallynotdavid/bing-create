import { describe, test, expect } from "bun:test";
import { createImages, createVideo } from "../src/client.ts";

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

describe("createVideo validation", () => {
  test("throws on empty prompt", () => {
    return expect(createVideo("", { cookie: "valid_cookie" }))
      .rejects.toThrow("Prompt must be a non-empty string");
  });

  test("throws on whitespace-only prompt", () => {
    return expect(createVideo("   ", { cookie: "valid_cookie" }))
      .rejects.toThrow("Prompt must be a non-empty string");
  });

  test("throws on empty cookie", () => {
    return expect(createVideo("test prompt", { cookie: "" }))
      .rejects.toThrow("options.cookie is required");
  });

  test("throws on whitespace-only cookie", () => {
    return expect(createVideo("test prompt", { cookie: "   " }))
      .rejects.toThrow("options.cookie is required");
  });
});
