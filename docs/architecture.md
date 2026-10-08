# Architecture

bing-create turns a prompt into image URLs or a video URL. It sends the requests
that bing.com/images/create sends, waits for the result, and cleans up the URLs
it finds. The HTTP contract is in [Bing API](bing-api.md).

## Code map

```text
src/
├── index.ts          public exports
├── client.ts         createImages, createVideo
├── types.ts          public types
├── constants.ts      MODEL_CONFIGS, USER_AGENT
├── shared/
│   ├── http.ts       fetchWithTimeout, getText, pollUntil, sleep
│   ├── options.ts    validate, resolveTimeouts and the timeout defaults
│   ├── request.ts    startGeneration, extractRequestId
│   └── url.ts        isBingUrl
├── image/
│   ├── generate.ts   start and poll an image generation
│   ├── parse.ts      image URLs from the result HTML
│   ├── url.ts        image URL normalization and filter
│   └── filename.ts   prompt to filename
└── video/
    ├── generate.ts   start and poll a video generation
    ├── parse.ts      video URL and pending message from responses
    └── url.ts        video URL normalization and filter
tests/                bun:test files, plus integration.test.ts
```

- `index.ts` is the only entry point. `bunup.config.ts` builds `dist/` from it,
  so anything it does not export is private.
- `client.ts` validates the input, fills the defaults, and calls the `image/` or
  `video/` modules in order. It holds no HTTP code.
- `constants.ts` maps `model` and `aspectRatio` to the `mdl` and `ar` request
  parameters. A new model starts there.
- `shared/http.ts` holds the only `fetch` call. It adds the cookie and headers,
  enforces the per-request timeout, and runs the poll loop that image and video
  share.
- `shared/request.ts` sends the starting POST and reads the request ID from the
  redirect.
- `generate.ts` in `image/` and `video/` builds the URLs and decides, per poll
  round, whether the response is a result, an error or "not ready".
- `parse.ts`, `url.ts` and `filename.ts` are pure functions over strings. They
  do no I/O, so `tests/` covers them without the network.

## Image flow

```text
createImages(prompt, options)           client.ts
  validate(), resolveTimeouts()         shared/options.ts
  initiateGeneration()                  image/generate.ts   POST, read Location
    startGeneration()                   shared/request.ts
      extractRequestId()                shared/request.ts
  pollForResults()                      image/generate.ts   GET until a body
    pollUntil()                         shared/http.ts
  extractImageUrls()                    image/parse.ts      src="..." values
    normalizeUrls()                     image/url.ts
  generateFilename()                    image/filename.ts   one per URL
  -> ImageResult[]
```

## Video flow

```text
createVideo(prompt, options)            client.ts
  validate(), resolveTimeouts()         shared/options.ts
  initiateVideoGeneration()             video/generate.ts   POST, read Location
    startGeneration()                   shared/request.ts
  pollForVideoUrl()                     video/generate.ts   GET two endpoints
    pollUntil()                         shared/http.ts
    extractVideoUrl()                   video/parse.ts      ourl="..." values
      normalizeVideoUrl()               video/url.ts
      isSolidVideoUrl()                 video/url.ts
  -> string
```

## Tests

`bun test` runs every file in `tests/`. `integration.test.ts` calls Bing and is
skipped when `BING_COOKIE` is not set. The other files run offline.
`tests/stub-bing.ts` replaces `fetch`, so `pipeline.test.ts` runs the whole flow
of `createImages` and `createVideo` against canned responses.
