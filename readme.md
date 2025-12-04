# [pkg]: bing-create

[![NPM Version](https://img.shields.io/npm/v/bing-create?logo=npm&logoColor=212121&label=version&labelColor=ffc44e&color=212121)](https://www.npmjs.com/package/bing-create)
[![codecov](https://codecov.io/gh/totallynotdavid/bing-create/graph/badge.svg?token=8OBBAZG8MN)](https://codecov.io/gh/totallynotdavid/bing-create)

Generate images via Bing Image Creator's internal API. Supports DALL-E 3,
GPT-4o, and MAI-Image-1.

```bash
npm install bing-create
```

```ts
import { createImages, Model, AspectRatio } from "bing-create";

const images = await createImages("a cat wearing a space helmet", {
  cookie: process.env.BING_COOKIE,
});

for (const image of images) {
  console.log(image.url); // https://www.bing.com/th/id/OIG1...
  console.log(image.filename); // a-cat-wearing-a-space-helmet-1.jpg
}
```

`createImages` returns an array of `ImageResult` objects. Each has a `url`
(direct link to the generated image) and a `filename` (slugified prompt with
index).

## Authentication

Bing Image Creator requires a `_U` cookie from an authenticated Microsoft
account.

<details>
<summary>How to get your cookie</summary>

1. Sign in at [bing.com/images/create](https://www.bing.com/images/create)
2. Open DevTools (F12) ⇢ Application ⇢ Cookies ⇢ `https://www.bing.com`
3. Copy the `_U` cookie value

The cookie typically lasts several days. You'll get authentication errors when
it expires.

</details>

## Models

Default is DALL-E 3, which generates 4 images per prompt. GPT-4o and MAI-Image-1
generate 1 image each and are much slower.

```ts
// GPT-4o with landscape aspect ratio
const images = await createImages("mountain sunset", {
  cookie: process.env.BING_COOKIE,
  model: Model.GPT4O,
  aspectRatio: AspectRatio.LANDSCAPE,
});
```

<details>
<summary>Model comparison</summary>

| Model       | Constant       | Images | Speed   | Aspect ratios |
| ----------- | -------------- | ------ | ------- | ------------- |
| DALL-E 3    | `Model.DALLE3` | 4      | ~5-15s  | 1:1, 7:4, 4:7 |
| MAI-Image-1 | `Model.MAI`    | 1      | ~20-30s | 1:1, 3:2, 2:3 |
| GPT-4o      | `Model.GPT4O`  | 1      | ~30-70s | 1:1, 3:2, 2:3 |

All models support `AspectRatio.SQUARE`, `AspectRatio.LANDSCAPE`, and
`AspectRatio.PORTRAIT`. The actual dimensions vary by model (see
[CONTRIBUTING.md](.github/CONTRIBUTING.md) for details).

</details>

## Reference

```ts
function createImages(prompt: string, options: Options): Promise<ImageResult[]>;
```

Generates images from a text prompt. Handles the full flow: initiation, polling,
and URL extraction.

<details>
<summary>Options</summary>

| Property              | Type              | Default      | Description                         |
| --------------------- | ----------------- | ------------ | ----------------------------------- |
| `cookie`              | `string`          | **required** | `_U` cookie from authenticated Bing |
| `model`               | `ModelType`       | `"dalle3"`   | Model to use for generation         |
| `aspectRatio`         | `AspectRatioType` | `"square"`   | Output aspect ratio                 |
| `generationTimeoutMs` | `number`          | `300000`     | Max wait for generation (5 min)     |
| `pollIntervalMs`      | `number`          | `1000`       | Polling interval                    |
| `requestTimeoutMs`    | `number`          | `30000`      | Individual request timeout          |

</details>

<details>
<summary>ImageResult</summary>

```ts
interface ImageResult {
  url: string; // Direct URL to generated image
  filename: string; // Suggested filename (slugified prompt + index)
}
```

</details>

<details>
<summary>Errors</summary>

| Error message                         | Cause                                                       |
| ------------------------------------- | ----------------------------------------------------------- |
| `"Prompt must be a non-empty string"` | Empty or invalid prompt                                     |
| `"options.cookie is required..."`     | Missing or empty cookie                                     |
| `"No redirect received from Bing"`    | Prompt blocked by content policy, or invalid/expired cookie |
| `"Generation timed out..."`           | Polling exceeded `generationTimeoutMs`                      |

</details>

## License

Apache-2.0
