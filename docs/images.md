# Images

```ts
createImages(prompt: string, options: CreateImagesOptions): Promise<ImageResult[]>
```

```ts
await createImages("mountain sunset", {
  cookie: process.env.BING_COOKIE ?? "", // required, see authentication.md
  model: "gpt4o", // "dalle3" (default) | "gpt4o" | "mai"
  aspectRatio: "landscape", // "square" (default) | "landscape" | "portrait"
  timeouts: { generationMs: 300_000, pollingMs: 1_000, requestMs: 30_000 },
});
```

`prompt` and `options.cookie` must contain a non-space character. See
[Authentication](authentication.md) for the cookie and [Timeouts](timeouts.md)
for the `timeouts` fields.

## Models and aspect ratios

| `model`  | Model       |
| -------- | ----------- |
| `dalle3` | DALL-E 3    |
| `gpt4o`  | GPT-4o      |
| `mai`    | MAI-Image-1 |

Every model accepts `square`, `landscape` and `portrait`. The model and aspect
ratio map to the `mdl` and `ar` request parameters in
[`src/constants.ts`](../src/constants.ts); see [Bing API](bing-api.md).

## Result

The promise resolves to a non-empty array of `ImageResult`:

```ts
interface ImageResult {
  url: string;
  suggestedFilename: string;
}
```

- `url` is an image URL. Which URLs the library returns, and in what form, is in
  [Bing API](bing-api.md#3-read-the-image-urls).
- `suggestedFilename` is the prompt in lowercase, with each run of characters
  outside `a-z0-9` replaced by `-`, leading and trailing `-` removed, cut to 50
  characters, followed by `_<index>.jpg`. The index starts at 0.
  `"A cat, wearing a space helmet!"` gives `a-cat-wearing-a-space-helmet_0.jpg`.
  A prompt with no ASCII letters or digits gives `_0.jpg`.

## Observed, not verified

Recorded on 2026-10-08 from earlier notes on Bing's behavior and not re-checked.
No test or code establishes these, and Bing can change them without notice.

- DALL-E 3 returns four images. GPT-4o and MAI-Image-1 return one. The
  integration test accepts one to four for DALL-E 3.
- Image sizes in pixels by aspect ratio:

  | `model`  | `square`  | `landscape` | `portrait` |
  | -------- | --------- | ----------- | ---------- |
  | `dalle3` | 1024x1024 | 1792x1024   | 1024x1792  |
  | `gpt4o`  | 1024x1024 | 1536x1024   | 1024x1536  |
  | `mai`    | 1024x1024 | 1248x832    | 832x1248   |

- DALL-E 3 finishes in 5 to 15 seconds. GPT-4o and MAI-Image-1 take 20 to 70
  seconds. Set `timeouts.generationMs` above the wait you expect.
- `pid=ImgGn` selects the full-resolution image.
- The CDN hosts `tse<N>.mm.bing.net` sometimes answer 403, which is why the
  library rewrites them to `www.bing.com`.
- Image IDs start with `OIG1` for DALL-E 3, `OIG2` for MAI-Image-1, and `OIG3`
  or `OIG4` for GPT-4o.
- Image URLs expire after hours or days. Download the images you keep.
- The `_U` cookie lasts several days.
- A prompt that Bing blocks by content policy gets `200` with the Bing Image
  Creator home page instead of a redirect, so the library throws
  `No redirect from Bing. Cookie may be invalid or expired.` An invalid cookie
  looks the same.
