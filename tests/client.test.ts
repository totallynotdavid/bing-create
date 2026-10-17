import { describe, test, expect } from "bun:test";
import { createImages, createVideo } from "../src/client.ts";

const entryPoints = [
  ["createImages", createImages],
  ["createVideo", createVideo],
] as const;

describe.each(entryPoints)("%s validation", (_name, create) => {
  test("rejects a blank prompt", () => {
    return expect(create("   ", { cookie: "valid_cookie" })).rejects.toThrow(
      "Prompt must be a non-empty string",
    );
  });

  test("rejects a blank cookie", () => {
    return expect(create("test prompt", { cookie: "   " })).rejects.toThrow(
      "options.cookie is required",
    );
  });
});
