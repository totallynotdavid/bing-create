# bing-create

[![NPM Version](https://img.shields.io/npm/v/bing-create?logo=npm&logoColor=212121&label=version&labelColor=ffc44e&color=212121)](https://www.npmjs.com/package/bing-create)
[![codecov](https://codecov.io/gh/totallynotdavid/bing-create/graph/badge.svg?token=8OBBAZG8MN)](https://codecov.io/gh/totallynotdavid/bing-create)

A TypeScript library that generates images and videos with Bing Image Creator.
It calls the same web endpoints as bing.com/images/create, so it needs the `_U`
cookie of a signed-in Microsoft account. It is not an official API. It returns
URLs and filenames and does not download files.

## Get started

```bash
npm install bing-create
```

The package is ESM only and has no runtime dependencies. It needs Node.js 22 or
later, or Bun.

Copy the `_U` cookie from your browser ([how](docs/authentication.md)) and
generate an image:

```ts
import { createImages } from "bing-create";

const images = await createImages("a cat wearing a space helmet", {
  cookie: process.env.BING_COOKIE ?? "",
});

for (const { url, suggestedFilename } of images) {
  console.log(suggestedFilename, url);
}
```

## Features

- Three image models: DALL-E 3 (default), GPT-4o and MAI-Image-1, in square,
  landscape and portrait.
- Video generation with `createVideo`, which returns one video URL.
- Returns image URLs, deduplicated, with a filename derived from the prompt.
- Three independent timeouts: total generation time, poll interval and
  per-request time.
- Throws an `Error` with the cause in its message when the cookie, the prompt or
  Bing rejects the request.

Here is a video example:

```ts
import { createVideo } from "bing-create";

const url = await createVideo("a paper boat on a pond", {
  cookie: process.env.BING_COOKIE ?? "",
  aspectRatio: "landscape",
});
```

## Documentation

- [Manual](docs/readme.md): authentication, images, video, timeouts, errors and
  the Bing API the library calls.
- [Architecture](docs/architecture.md): the code map.
- [Contributing](.github/CONTRIBUTING.md): set up, check and submit a change.
