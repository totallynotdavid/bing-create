import { test, expect } from "bun:test";
import { normalizeUrls } from "../src/image/url.ts";

const real = "https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn";
const realNormalized = "https://www.bing.com/th/id/OIG4.real?pid=ImgGn";

test.each([
  [
    "rewrites the CDN host, decodes entities and keeps only pid",
    [
      "https://tse3.mm.bing.net/th/id/OIG4.a?w=270&amp;h=270&amp;c=6&amp;r=0&amp;o=5&amp;pid=ImgGn",
    ],
    ["https://www.bing.com/th/id/OIG4.a?pid=ImgGn"],
  ],
  [
    "decodes the JSON escape of an ampersand",
    [`/th/id/OIG4.json?w=1${"\\"}${"u0026"}pid=ImgGn`],
    ["https://www.bing.com/th/id/OIG4.json?pid=ImgGn"],
  ],
  [
    "makes a relative URL absolute",
    ["/th/id/OIG4.relative?pid=ImgGn"],
    ["https://www.bing.com/th/id/OIG4.relative?pid=ImgGn"],
  ],
  [
    "adds pid=ImgGn when missing",
    ["https://www.bing.com/th/id/OIG4.nopid"],
    ["https://www.bing.com/th/id/OIG4.nopid?pid=ImgGn"],
  ],
  ["removes duplicates", [real, real], [realNormalized]],
  [
    "drops .js and .svg files",
    [
      "https://r.bing.com/script.br.js",
      "https://www.bing.com/th/id/script.js",
      "/th/id/icon.SVG",
      real,
    ],
    [realNormalized],
  ],
  [
    "drops URLs outside https bing.com/th/id/",
    [
      "https://evilbing.com/th/id/OIG4.fake?pid=ImgGn",
      "https://www.bing.com/rp/OIG4.fake?pid=ImgGn",
      "http://www.bing.com/th/id/OIG4.plain",
      "/static/logo.png",
      real,
    ],
    [realNormalized],
  ],
])("normalizeUrls %s", (_name, raw, expected) => {
  expect(normalizeUrls(raw)).toEqual(expected);
});
