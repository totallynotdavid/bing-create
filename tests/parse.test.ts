import { describe, test, expect } from "bun:test";
import { extractImageUrls } from "../src/image/parse.ts";

describe("extractImageUrls", () => {
  test("extracts multiple image URLs from HTML", () => {
    const html = `
      <img src="https://tse1.mm.bing.net/th/id/OIG4.test1?pid=ImgGn"/>
      <img src="https://tse2.mm.bing.net/th/id/OIG4.test2?pid=ImgGn"/>
    `;

    const urls = extractImageUrls(html);

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("OIG4.test1");
    expect(urls[1]).toContain("OIG4.test2");
  });

  test("extracts DALL-E 3 response with 4 images", () => {
    const html = `
      <img src="https://tse3.mm.bing.net/th/id/OIG4.HfM5lIwyCttDOzJbyOCW?w=270&amp;h=270&amp;pid=ImgGn"/>
      <img src="https://tse4.mm.bing.net/th/id/OIG4.KlXYym2JqxlbBaa398Dm?w=270&amp;h=270&amp;pid=ImgGn"/>
      <img src="https://tse3.mm.bing.net/th/id/OIG4.t3zhkpucTDOhAvlOwhpo?w=270&amp;h=270&amp;pid=ImgGn"/>
      <img src="https://tse1.mm.bing.net/th/id/OIG4.3x_XtWuqP68T7JRwKQm9?w=270&amp;h=270&amp;pid=ImgGn"/>
    `;

    expect(extractImageUrls(html)).toHaveLength(4);
  });

  test("throws when no images found", () => {
    expect(() => extractImageUrls("<div>no images here</div>")).toThrow(
      "No images found",
    );
  });

  test("throws when every src is filtered out", () => {
    const html = '<img src="https://www.bing.com/th/id/icon.svg"/>';
    expect(() => extractImageUrls(html)).toThrow("No images found");
  });

  test("throws on empty HTML", () => {
    expect(() => extractImageUrls("")).toThrow("No images found");
  });
});
