# Bing API

The library drives the web endpoints behind bing.com/images/create. They are not
a documented API and can change without notice. This page records what the code
in `src/` sends and reads.

Every request is sent by `fetchWithTimeout` in
[`src/shared/http.ts`](../src/shared/http.ts) with these headers and with
`redirect: "manual"`, so a 302 reaches the caller:

```http
cookie: _U=<cookie>
user-agent: <USER_AGENT in src/constants.ts>
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-language: en-US,en;q=0.9
```

## Images

Code: [`src/image/generate.ts`](../src/image/generate.ts).

### 1. Start the generation

```http
POST https://www.bing.com/images/create?q={prompt}&rt=4&mdl={mdl}&ar={ar}&FORM=GENCRE
```

| Parameter | Value                                                  |
| --------- | ------------------------------------------------------ |
| `q`       | The URL-encoded prompt.                                |
| `rt`      | Always `4`.                                            |
| `mdl`     | Model: `0` DALL-E 3, `1` GPT-4o, `4` MAI-Image-1.      |
| `ar`      | Aspect ratio: `1` square, `2` landscape, `3` portrait. |
| `FORM`    | Always `GENCRE`.                                       |

`mdl` and `ar` come from `MODEL_CONFIGS` in
[`src/constants.ts`](../src/constants.ts). The three models use the same `ar`
codes.

Bing returns `302 Found`. The `Location` header holds the request ID in its `id`
parameter, read by `extractRequestId` in
[`src/shared/request.ts`](../src/shared/request.ts):

```http
HTTP/1.1 302 Found
Location: /images/create?q={prompt}&rt=4&mdl=0&ar=1&FORM=GENCRE&id=1-6930d798aebe4d2a9d54027da1fdb513
```

### 2. Poll for the result

```http
GET https://www.bing.com/images/create/async/results/{id}?q={prompt}&mdl={mdl}&ar={ar}
```

The library repeats this request every `pollingMs`. It reads the response body:

| Response               | Meaning                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Non-2xx status         | Throws `HTTP <status>: <statusText>`.                                                                              |
| Empty body             | Still generating. Wait `pollingMs` and poll again.                                                                 |
| Body starting with `{` | JSON. With `errorMessage`, throws `Bing error: ...`. Without it, throws `Unexpected JSON response from Bing: ...`. |
| Anything else          | HTML with the images. Parse it.                                                                                    |

### 3. Read the image URLs

`extractImageUrls` takes the value of every `src="..."` attribute in the HTML.
The tests feed it relative paths and absolute CDN URLs:

```html
<img src="/th/id/OIG4.relative?pid=ImgGn" />
<img
  src="https://tse1.mm.bing.net/th/id/OIG4.test1?w=270&amp;h=270&amp;pid=ImgGn"
/>
```

This section owns the image URL contract. `normalizeUrls` in
[`src/image/url.ts`](../src/image/url.ts) turns every raw URL into one form, in
this order:

1. Decode `&lt;`, `&gt;`, `&quot;`, `&#39;` and `&amp;`.
2. Prefix a path that starts with `/th/id/` with `https://www.bing.com`.
3. Rewrite `https://tse<N>.mm.bing.net/th/id/` to `https://www.bing.com/th/id/`.
4. Keep only the `pid` query parameter, or add `pid=ImgGn` when there is none.
5. Keep a URL only if it is a [Bing URL](#bing-urls) and its path starts with
   `/th/id/` and does not end in `.js` or `.svg` (case-insensitive). The query
   is not part of the path. `https://th.bing.com/th/id/...` stays as it is.
6. Remove duplicates.

When no URL is left, `extractImageUrls` throws `No images found in response`.

## Video

Code: [`src/video/generate.ts`](../src/video/generate.ts).

### 1. Start the generation

```http
POST https://www.bing.com/images/create/ai-video-generator?q={prompt}&rt=4&mdl=0&ar={ar}&FORM=GENCRE&hva=4&pt=4&sm=1
```

`ar` is `4` for portrait and `5` for landscape (`VIDEO_ASPECT_RATIO_MAP` in
[`src/client.ts`](../src/client.ts)). The response is a 302 whose `Location`
holds the request ID, as for images.

### 2. Poll for the result

Each round sends up to two requests and stops at the first that yields a video
URL:

1. `GET https://www.bing.com/images/create/async/results/{id}?q={prompt}&mdl=0&ar={ar}`.
   A non-2xx status throws. If the body has a video URL, return it. If the body
   is JSON with an `errorMessage` other than `pending` or `still pending`
   (compared case-insensitively), throw `Bing error: ...`.
2. `GET https://www.bing.com/images/create/ai-video-generator?q={prompt}&id={id}&rt=4&pt=4&FORM=GUH2CR&dmreload=1`.
   A non-2xx status throws. If the body has a video URL, return it.

When neither request yields a URL, the library waits `pollingMs` and starts the
next round.

### 3. Read the video URL

This section owns the video URL contract. `extractVideoUrl` in
[`src/video/parse.ts`](../src/video/parse.ts) decodes `\/`, `&` and the HTML
entities in the body, then takes the first `ourl="..."` attribute whose URL
passes [`src/video/url.ts`](../src/video/url.ts). The host `tse<N>.mm.bing.net`
is first rewritten to `th.bing.com`. The URL is skipped unless all of these
hold:

- It is a [Bing URL](#bing-urls).
- It has `pid=videocreator`.
- It has none of the parameters `w`, `h`, `c`, `rs`, `qlt`, `o`.

## Bing URLs

`isBingUrl` in [`src/shared/url.ts`](../src/shared/url.ts) accepts a URL that
uses `https` and has the host `bing.com` or a subdomain of it. Image and video
URLs must both pass it.

## Errors

The library reports failures from these signals:

- A response to the first request without a `Location` header throws
  `No redirect from Bing. Cookie may be invalid or expired.`
- A poll that returns JSON with an `errorMessage` throws `Bing error: ...`.
- Empty bodies make an image generation keep polling until `generationMs`
  passes.

The messages the library throws are in [Errors](errors.md). What Bing does to
cause them is listed under
[Observed, not verified](images.md#observed-not-verified).

## Example

```text
POST /images/create?q=a+cat&rt=4&mdl=0&ar=1&FORM=GENCRE
  302, Location: ...&id=1-abc123
GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
  200, empty body: still processing
GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
  200, HTML with image URLs
```
