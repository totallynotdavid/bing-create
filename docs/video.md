# Video

```ts
createVideo(prompt: string, options: CreateVideoOptions): Promise<string>
```

```ts
const url = await createVideo("a paper boat on a pond", {
  cookie: process.env.BING_COOKIE ?? "", // required, see authentication.md
  aspectRatio: "landscape", // "portrait" (default) | "landscape"
  timeouts: { generationMs: 300_000, pollingMs: 1_000, requestMs: 30_000 },
});
```

`prompt` and `options.cookie` must contain a non-space character. See
[Authentication](authentication.md) for the cookie and [Timeouts](timeouts.md)
for the `timeouts` fields.

The promise resolves to one video URL. Video has no model option and returns no
filename. Which URL the library picks is in
[Bing API](bing-api.md#3-read-the-video-url). See [Errors](errors.md) for what
it throws.
