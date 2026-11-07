import { describe, test, expect } from "bun:test";
import { createImages, createVideo } from "../src/client.ts";
import { redirect, stubBing } from "./stub-bing.ts";

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

  test("rejects a prompt that is not a string", () => {
    return expect(
      create(5 as never, { cookie: "valid_cookie" }),
    ).rejects.toThrow("Prompt must be a non-empty string");
  });

  test("rejects a blank cookie", () => {
    return expect(create("test prompt", { cookie: "   " })).rejects.toThrow(
      "options.cookie is required",
    );
  });

  test("rejects missing options", () => {
    return expect(create("test prompt", undefined as never)).rejects.toThrow(
      "options.cookie is required",
    );
  });

  test.each([
    ["NaN", Number.NaN],
    ["a negative number", -1],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a string", "100"],
  ])("rejects a timeout that is %s", (_case, value) => {
    return expect(
      create("test prompt", {
        cookie: "valid_cookie",
        timeouts: { pollingMs: value as never },
      }),
    ).rejects.toThrow(
      "options.timeouts.pollingMs must be a finite number of 0 or more",
    );
  });
});

describe("option values", () => {
  test.each([
    [
      "model",
      { model: "bogus" },
      "options.model must be one of: dalle3, gpt4o, mai",
    ],
    [
      "model on the prototype",
      { model: "toString" },
      "options.model must be one of",
    ],
    [
      "aspectRatio",
      { aspectRatio: "wide" },
      "options.aspectRatio must be one of: square, landscape, portrait",
    ],
  ])("createImages rejects an unknown %s", async (_case, extra, message) => {
    const { requests } = stubBing(() => redirect("1-abc"));

    await expect(
      createImages("test", { cookie: "valid_cookie", ...extra } as never),
    ).rejects.toThrow(message);
    expect(requests).toEqual([]);
  });

  test("createVideo rejects an image aspect ratio", async () => {
    const { requests } = stubBing(() => redirect("1-vid"));

    await expect(
      createVideo("test", {
        cookie: "valid_cookie",
        aspectRatio: "square",
      } as never),
    ).rejects.toThrow(
      "options.aspectRatio must be one of: portrait, landscape",
    );
    expect(requests).toEqual([]);
  });
});
