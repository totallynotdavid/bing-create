# Contributing

## Setup

Install tools via [mise](https://mise.jdx.dev/getting-started.html). All tools
are configured in `mise.toml`:

```bash
mise install
bun install
```

Run tests and checks:

```bash
bun run test       # bun test runner
bun run check      # format + lint with Biome
```

## Architecture

The codebase is organized into:

```
src/
├── index.ts      # public exports
├── client.ts     # createImages() with polling logic
├── types.ts      # model/aspect ratio enums, interfaces
├── parse.ts      # HTML/URL parsing, content policy detection
└── filename.ts   # prompt-to-slug filename generation
```

The data flow follows this sequence:

```
createImages()
  ⇢ initiateGeneration() (POST to create)
  ⇢ pollForResults() (GET loop until ready)
  ⇢ extractImageUrls() (parse HTML response)
  ⇢ return ImageResult[]
```

## Code style

Use Biome for formatting and linting, not ESLint or Prettier. The configuration
enforces double quotes, two-space indent, and 80 character line width. Import
statements must include `.ts` extensions.

Prefer `as const` objects for enums instead of TypeScript enums. See `Model` and
`AspectRatio` in `types.ts` for examples. Avoid classes in favor of plain
functions and interfaces. Throw descriptive error messages with enough context
for debugging.

## API documentation

All requests require the `_U` cookie from an authenticated Bing session:
`Cookie: _U=<cookie>`

### Models and parameters

Available models and their API parameters:

| Model       | `mdl` | Output   | Aspect ratios |
| ----------- | ----- | -------- | ------------- |
| DALL-E 3    | `0`   | 4 images | 1:1, 7:4, 4:7 |
| GPT-4o      | `1`   | 1 image  | 1:1, 3:2, 2:3 |
| MAI-Image-1 | `4`   | 1 image  | 1:1, 3:2, 2:3 |

The `ar` parameter controls aspect ratio. Values differ by model:

**DALL-E 3** (`mdl=0`):

- `ar=1`: 1:1 square (1024x1024)
- `ar=2`: 7:4 landscape (1792x1024)
- `ar=3`: 4:7 portrait (1024x1792)

**GPT-4o** (`mdl=1`):

- `ar=1`: 1:1 square (1024x1024)
- `ar=2`: 3:2 landscape (1536x1024)
- `ar=3`: 2:3 portrait (1024x1536)

**MAI-Image-1** (`mdl=4`):

- `ar=1`: 1:1 square (1024x1024)
- `ar=2`: 3:2 landscape (1248x832)
- `ar=3`: 2:3 portrait (832x1248)

### Generation flow

**Step 1**: Initiate generation

Send a POST request to start the generation process:

```http
POST /images/create?q={prompt}&rt=4&mdl={model}&ar={aspect}&FORM=GENCRE HTTP/1.1
Host: www.bing.com
Cookie: _U={cookie}
```

Parameters:

- `q`: URL-encoded prompt (required)
- `rt`: Request type, always use `4` (required)
- `mdl`: Model ID: `0` (DALL-E 3), `1` (GPT-4o), or `4` (MAI-Image-1). Default:
  `0`
- `ar`: Aspect ratio: `1` (square), `2` (landscape), or `3` (portrait). Default:
  `1`
- `FORM`: Form identifier, use `GENCRE`

The response is a 302 redirect with the request ID in the location header:

```http
HTTP/1.1 302 Found
Location: /images/create?q={prompt}&rt=4&mdl=0&ar=1&FORM=GENCRE&id={request_id}
```

Extract the `id` parameter from the redirect URL. Format is `1-{uuid}`, like
`1-6930d798aebe4d2a9d54027da1fdb513`.

If there's no redirect (200 status with HTML), the prompt was blocked by content
policy or the cookie is invalid.

**Step 2**: Poll for results

Poll the results endpoint until generation completes:

```http
GET /images/create/async/results/{request_id}?q={prompt}&mdl={model}&ar={aspect} HTTP/1.1
Host: www.bing.com
Cookie: _U={cookie}
```

Response meanings:

- 200 with empty body: Still generating, poll again
- 200 with HTML body: Generation complete, parse image URLs
- 200 with JSON containing `errorMessage`: Generation failed

Poll every 1-2 seconds. Typical wait time is 5-70 seconds depending on model and
server load.

### Parsing results

The HTML response contains image URLs in `src` attributes:

```html
<img src="/th/id/OIG1.abc123?w=540&h=540&c=6&pid=ImgGn" />
```

URLs come in two formats. GPT-4o and MAI-Image-1 return relative paths:

```
/th/id/OIG3.abc123?w=540&h=540&pid=ImgGn
```

DALL-E 3 returns absolute CDN URLs:

```
https://tse1.mm.bing.net/th/id/OIG1.abc123?pid=ImgGn
```

The library normalizes all URLs to a consistent format. Convert relative URLs to
absolute by prefixing with `https://www.bing.com`. Convert CDN URLs
(tse1.mm.bing.net, etc.) to www.bing.com. Use the `?pid=ImgGn` parameter for
full resolution images.

Image ID prefixes indicate the model: `OIG1` for DALL-E 3, `OIG2` for
MAI-Image-1, `OIG3` and `OIG4` for GPT-4o.

### Error handling

Content policy blocks happen at initiation. Instead of a 302 redirect, the POST
returns 200 with the Bing Image Creator homepage HTML. This means no request ID
and no ability to poll. The prompt must be modified.

JSON error responses during polling contain an `errorMessage` field:

```json
{
  "errorMessage": "Description of the error"
}
```

If polling returns empty responses indefinitely, generation failed silently. The
library handles this with the generation timeout.

### Complete example

```
1. POST /images/create?q=a+cat&rt=4&mdl=0&ar=1&FORM=GENCRE
   ⇢ 302 Redirect with id=1-abc123

2. GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
   ⇢ 200 (empty, still processing)

3. GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
   ⇢ 200 (empty, still processing)

4. GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
   ⇢ 200 (HTML with 4 image URLs)
```

### Notes

Image URLs expire after several hours or days. The `rt=4` parameter appears
required for all models. Generation times vary: DALL-E 3 takes 5-15 seconds,
GPT-4o and MAI-Image-1 take 20-70 seconds.

## Adding new models

When Bing adds new models, update the library in three places:

1. Add the model to the `Model` const in `types.ts`
2. Add an entry to `MODEL_CONFIGS` with the `mdl` value, `expectedImages` count,
   and `aspectRatios` mapping
3. Test with both single and multiple image outputs to verify the expected count

The aspect ratio mapping should follow the pattern established by existing
models, using integers 1, 2, and 3 for square, landscape, and portrait
respectively.
