import { describe, test, expect } from "bun:test";
import { extractRequestId } from "../src/shared/request.ts";

describe("extractRequestId", () => {
  test("extracts ID from redirect URL", () => {
    const url = "/images/create?q=test&id=1-abc123def&FORM=GENCRE";
    expect(extractRequestId(url)).toBe("1-abc123def");
  });

  test("extracts ID when id is first param", () => {
    const url = "?id=xyz789&q=test";
    expect(extractRequestId(url)).toBe("xyz789");
  });

  test("throws when no id param exists", () => {
    expect(() => extractRequestId("?q=test&foo=bar")).toThrow(
      "Failed to extract request ID",
    );
  });

  test("throws when id is empty", () => {
    expect(() => extractRequestId("?id=&q=test")).toThrow(
      "Failed to extract request ID",
    );
  });
});
