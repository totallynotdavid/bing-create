# [pkg]: bing-create

[![NPM Version](https://img.shields.io/npm/v/bing-create?logo=npm&logoColor=212121&label=version&labelColor=ffc44e&color=212121)](https://www.npmjs.com/package/bing-create)
[![codecov](https://codecov.io/gh/totallynotdavid/bing-create/graph/badge.svg?token=8OBBAZG8MN)](https://codecov.io/gh/totallynotdavid/bing-create)

Generate images using Bing Image Creator's internal API. Supports DALL-E 3,
GPT-4o, and MAI-Image-1 models.

```bash
npm install bing-create
```

## Basic usage

The package exports a single function that generates images from text prompts.
You need the `_U` cookie from an authenticated Microsoft account to use the API.
Sign in at [bing.com/images/create](https://www.bing.com/images/create), open
DevTools (F12), go to Application ⇢ Cookies ⇢ `https://www.bing.com`, and copy
the `_U` cookie value.

```ts
import { createImages } from "bing-create";

const images = await createImages("a cat wearing a space helmet", {
  cookie: process.env.BING_COOKIE ?? "",
});

for (const { url, suggestedFilename } of images) {
  console.log(url);
  console.log(suggestedFilename);
}
```

The function returns an array of results with URLs and suggested filenames.
Authentication errors indicate the cookie expired. Cookies typically last
several days.

## Models and aspect ratios

Three models are available with different performance characteristics:

| Model       | Images | Speed   | Aspect ratios    |
| ----------- | ------ | ------- | ---------------- |
| DALL-E 3    | 4      | ~5-15s  | square, 7:4, 4:7 |
| MAI-Image-1 | 1      | ~20-30s | square, 3:2, 2:3 |
| GPT-4o      | 1      | ~30-70s | square, 3:2, 2:3 |

DALL-E 3 is the default model. All models support their listed aspect ratios.
Actual pixel dimensions vary by model and are documented in
[CONTRIBUTING.md](.github/CONTRIBUTING.md).

```ts
await createImages("mountain sunset", {
  cookie: process.env.BING_COOKIE ?? "",
  model: "gpt4o",
  aspectRatio: "landscape",
});
```

## Configuration

The `createImages` function accepts a prompt string and an options object. The
cookie field is required. All other fields are optional:

<!-- prettier-ignore -->
```ts
await createImages(prompt, {
  cookie: string,           // required: _U cookie value
  model: "dalle3",          // optional: dalle3 | gpt4o | mai
  aspectRatio: "square",    // optional: square | landscape | portrait
  timeouts: {
    generationMs: 300_000,   // optional: total generation timeout
    pollingMs: 1_000,        // optional: poll interval
    requestMs: 30_000,       // optional: per-request timeout
  },
});
```

Timeouts control generation behavior. The generation timeout sets the maximum
wait time for image creation. Polling interval determines how often to check for
completion. Request timeout applies to individual HTTP requests.

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for error scenarios and
implementation details.
