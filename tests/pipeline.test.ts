import { describe, test, expect } from "bun:test";
import { createImages, createVideo } from "../src/client.ts";
import { redirect, stubBing } from "./stub-bing.ts";

const cookie = "valid_cookie";

function imageHtml(...srcs: string[]): string {
  return srcs.map((src) => `<img src="${src}"/>`).join("\n");
}

function stubImages(resultBody: () => string) {
  return stubBing((url, method) => {
    if (method === "POST") return redirect("1-abc");
    if (url.pathname.startsWith("/images/create/async/results/1-abc")) {
      return new Response(resultBody());
    }
    return new Response("unexpected", { status: 500 });
  });
}

describe("createImages", () => {
  test("returns normalized image URLs with filenames", async () => {
    stubImages(() =>
      imageHtml(
        "https://tse1.mm.bing.net/th/id/OIG4.one?w=270&amp;pid=ImgGn",
        "/th/id/OIG4.two",
      ),
    );

    const results = await createImages("A cat!", { cookie });

    expect(results).toEqual([
      {
        url: "https://www.bing.com/th/id/OIG4.one?pid=ImgGn",
        suggestedFilename: "a-cat_0.jpg",
      },
      {
        url: "https://www.bing.com/th/id/OIG4.two?pid=ImgGn",
        suggestedFilename: "a-cat_1.jpg",
      },
    ]);
  });

  test("drops .js and .svg assets served from the image path", async () => {
    stubImages(() =>
      imageHtml(
        "https://www.bing.com/th/id/icon.svg",
        "https://www.bing.com/th/id/script.js",
        "https://www.bing.com/th/id/script.br.js",
        "https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn",
      ),
    );

    const results = await createImages("test", { cookie });

    expect(results.map((r) => r.url)).toEqual([
      "https://www.bing.com/th/id/OIG4.real?pid=ImgGn",
    ]);
  });

  test("drops .js and .svg assets that carry a query string", async () => {
    stubImages(() =>
      imageHtml(
        "https://www.bing.com/th/id/icon.svg?w=10&amp;h=10",
        "https://tse2.mm.bing.net/th/id/script.br.js?pid=ImgGn",
        "/th/id/ICON.SVG?pid=ImgGn",
        "https://tse1.mm.bing.net/th/id/OIG4.real?pid=ImgGn",
      ),
    );

    const results = await createImages("test", { cookie });

    expect(results.map((r) => r.url)).toEqual([
      "https://www.bing.com/th/id/OIG4.real?pid=ImgGn",
    ]);
  });

  test("rejects when every src is filtered out", () => {
    stubImages(() =>
      imageHtml(
        "https://www.bing.com/th/id/icon.svg",
        "https://r.bing.com/rp/script.js",
      ),
    );

    return expect(createImages("test", { cookie })).rejects.toThrow(
      "No images found in response",
    );
  });

  test("rejects when the response has no src at all", () => {
    stubImages(() => "<div>blocked</div>");

    return expect(createImages("test", { cookie })).rejects.toThrow(
      "No images found in response",
    );
  });

  test("polls until the body is not empty", async () => {
    let calls = 0;
    const { requests } = stubImages(() => {
      calls++;
      return calls < 3 ? "" : imageHtml("/th/id/OIG4.late");
    });

    const results = await createImages("test", {
      cookie,
      timeouts: { pollingMs: 1 },
    });

    expect(results).toHaveLength(1);
    expect(requests.filter((r) => r.startsWith("GET"))).toHaveLength(3);
  });

  test("surfaces the Bing error message", () => {
    stubImages(() => JSON.stringify({ errorMessage: "blocked prompt" }));

    return expect(createImages("test", { cookie })).rejects.toThrow(
      "Bing error: blocked prompt",
    );
  });

  test("times out when the body stays empty", () => {
    stubImages(() => "");

    return expect(
      createImages("test", {
        cookie,
        timeouts: { generationMs: 30, pollingMs: 5 },
      }),
    ).rejects.toThrow("Image generation timed out after 0.03s");
  });

  test("rejects when Bing does not redirect", () => {
    stubBing(() => new Response("<html>home</html>"));

    return expect(createImages("test", { cookie })).rejects.toThrow(
      "No redirect from Bing",
    );
  });
});

describe("createVideo", () => {
  const videoUrl = "https://th.bing.com/th/id/OVID.abc?pid=videocreator";

  test("returns the video URL once the async endpoint has it", async () => {
    stubBing((_url, method) => {
      if (method === "POST") return redirect("1-vid");
      return new Response(`<div ourl="${videoUrl}"></div>`);
    });

    expect(await createVideo("test", { cookie })).toBe(videoUrl);
  });

  test("keeps polling through pending JSON and falls back to the result page", async () => {
    let asyncCalls = 0;
    const { requests } = stubBing((url, method) => {
      if (method === "POST") return redirect("1-vid");
      if (url.pathname.startsWith("/images/create/async/results/")) {
        asyncCalls++;
        return Response.json({ errorMessage: "Pending" });
      }
      return asyncCalls < 2
        ? new Response("")
        : new Response(`<div ourl="${videoUrl}"></div>`);
    });

    const result = await createVideo("test", {
      cookie,
      timeouts: { pollingMs: 1 },
    });

    expect(result).toBe(videoUrl);
    expect(requests).toContain("GET /images/create/ai-video-generator");
  });

  test("ignores video URLs on hosts that are not Bing", () => {
    stubBing((_url, method) =>
      method === "POST"
        ? redirect("1-vid")
        : new Response(
            `<div ourl="https://example.com/v.mp4?pid=videocreator"></div>`,
          ),
    );

    return expect(
      createVideo("test", {
        cookie,
        timeouts: { generationMs: 30, pollingMs: 5 },
      }),
    ).rejects.toThrow("Video generation timed out");
  });

  test("surfaces a Bing error that is not pending", () => {
    stubBing((_url, method) =>
      method === "POST"
        ? redirect("1-vid")
        : Response.json({ errorMessage: "blocked prompt" }),
    );

    return expect(createVideo("test", { cookie })).rejects.toThrow(
      "Bing error: blocked prompt",
    );
  });

  test("times out when no video appears", () => {
    stubBing((_url, method) =>
      method === "POST" ? redirect("1-vid") : new Response(""),
    );

    return expect(
      createVideo("test", {
        cookie,
        timeouts: { generationMs: 30, pollingMs: 5 },
      }),
    ).rejects.toThrow("Video generation timed out after 0.03s");
  });
});
