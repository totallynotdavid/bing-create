# [pkg]: bing-create

[![NPM Version](https://img.shields.io/npm/v/bing-create?logo=npm&logoColor=212121&label=version&labelColor=ffc44e&color=212121)](https://www.npmjs.com/package/bing-create)
[![codecov](https://codecov.io/gh/totallynotdavid/bing-create/graph/badge.svg?token=8OBBAZG8MN)](https://codecov.io/gh/totallynotdavid/bing-create)

Generate images via Bing Image Creator's internal API. Supports DALL-E 3,
GPT-4o, and MAI-Image-1.

```bash
npm install bing-create
```

## Quick start

The `createImages` function generates images from text prompts and returns an
array of results with URLs and suggested filenames:

```ts
import { createImages } from "bing-create";

const images = await createImages("a cat wearing a space helmet", {
  cookie: process.env.BING_COOKIE,
});

for (const image of images) {
  console.log(image.url); // https://www.bing.com/th/id/OIG1...
  console.log(image.filename); // a-cat-wearing-a-space-helmet-1.jpg
}
```

## Authentication

Bing Image Creator requires the `_U` cookie from an authenticated Microsoft
account. Sign in at
[bing.com/images/create](https://www.bing.com/images/create), open DevTools
(F12), navigate to Application ⇢ Cookies ⇢ `https://www.bing.com`, and copy the
`_U` cookie value.

The cookie typically lasts several days. Authentication errors indicate
expiration.

## Models

The library supports three models with different characteristics. DALL-E 3 is
the default:

| Model       | Images | Speed   | Aspect ratios    |
| ----------- | ------ | ------- | ---------------- |
| DALL-E 3    | 4      | ~5-15s  | square, 7:4, 4:7 |
| MAI-Image-1 | 1      | ~20-30s | square, 3:2, 2:3 |
| GPT-4o      | 1      | ~30-70s | square, 3:2, 2:3 |

Use the `Model` enum to specify which model to use:

```ts
import { createImages, Model, AspectRatio } from "bing-create";

const images = await createImages("mountain sunset", {
  cookie: process.env.BING_COOKIE,
  model: Model.GPT4O,
  aspectRatio: AspectRatio.LANDSCAPE,
});
```

All models support square, landscape, and portrait orientations via
`AspectRatio.SQUARE`, `AspectRatio.LANDSCAPE`, and `AspectRatio.PORTRAIT`.
Actual dimensions vary by model.

## Configuration

The `createImages` function accepts an options object with the following
properties:

Required:

- `cookie`: The `_U` cookie value from an authenticated Bing session

Optional:

- `model`: Model to use (default: `Model.DALLE3`)
- `aspectRatio`: Output aspect ratio (default: `AspectRatio.SQUARE`)
- `generationTimeoutMs`: Maximum wait time for generation in milliseconds
  (default: `300000` / 5 minutes)
- `pollIntervalMs`: Interval between polling requests (default: `1000`)
- `requestTimeoutMs`: Timeout for individual HTTP requests (default: `30000`)

The function handles the full generation flow including initiation, polling, and
URL extraction. It returns a promise that resolves to an array of `ImageResult`
objects, each containing a `url` (direct link to the generated image) and a
`filename` (slugified prompt with index).

## Error handling

Common errors and their causes:

- `"Prompt must be a non-empty string"`: The prompt parameter is empty or not a
  string.
- `"options.cookie is required..."`: The cookie option is missing or empty.
- `"No redirect received from Bing"`: The prompt was blocked by content policy,
  or the cookie is invalid or expired. Blocked prompts include explicit content,
  violence, and hate speech. Modify the prompt or refresh your cookie.
- `"Generation timed out..."`: Polling exceeded the `generationTimeoutMs` limit.
  The default is five minutes. Increase the timeout or try again with a simpler
  prompt.

---

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for architecture details and API
documentation. Apache-2.0 License.
