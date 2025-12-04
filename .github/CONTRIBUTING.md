# How to contribute

You can install the tools via [mise](https://mise.jdx.dev/getting-started.html).
All tools are configured in [mise.toml](../mise.toml). You just need to then do:

```bash
mise install
bun install
```

Available commands:

```bash
bun run test       # Run tests (bun test runner)
bun run check      # Format + lint (Biome)
```

## Architecture

```
src/
├── index.ts      # Public exports only
├── client.ts     # Main API: createImages() with polling logic
├── types.ts      # Model/AspectRatio enums, Options/ImageResult interfaces
├── parse.ts      # HTML/URL parsing, content policy detection
└── filename.ts   # Prompt-to-slug filename generation
```

The data flow:

```
createImages() ⇢ initiateGeneration() (POST) ⇢ pollForResults() (GET loop)
             ⇢ extractImageUrls() ⇢ return ImageResult[]
```

```mermaid
flowchart LR
    A[createImages()] --> B[initiateGeneration()<br/>(POST)]
    B --> C[pollForResults()<br/>(GET loop)]
    C --> D[extractImageUrls()]
    D --> E[return ImageResult[]]
```

## Code conventions

- Biome for formatting (not ESLint/Prettier)
- Double quotes, 2-space indent, 80 char line width
- `.ts` extensions in imports
- Use `as const` objects for enums (see `Model` and `AspectRatio` in types.ts)
- No classes—use plain functions and interfaces
- Throw descriptive `Error` messages with context

---

# Documentation for Bing Image Creator's internal HTTP API

This is unofficial and may change without notice.

All requests require the `_U` cookie from an authenticated Bing session.

```
Cookie: _U=<cookie>
```

Available models:

| Model       | `mdl` | Output   | Aspect ratios |
| ----------- | ----- | -------- | ------------- |
| DALL-E 3    | `0`   | 4 images | 1:1, 7:4, 4:7 |
| GPT-4o      | `1`   | 1 image  | 1:1, 3:2, 2:3 |
| MAI-Image-1 | `4`   | 1 image  | 1:1, 3:2, 2:3 |

The `ar` parameter controls aspect ratio. Values differ by model:

<details>
<summary>DALL-E 3 (mdl=0)</summary>

| `ar` | Ratio           | Dimensions |
| ---- | --------------- | ---------- |
| `1`  | 1:1 (square)    | 1024×1024  |
| `2`  | 7:4 (landscape) | 1792×1024  |
| `3`  | 4:7 (portrait)  | 1024×1792  |

</details>

<details>
<summary>GPT-4o (mdl=1)</summary>

| `ar` | Ratio           | Dimensions |
| ---- | --------------- | ---------- |
| `1`  | 1:1 (square)    | 1024×1024  |
| `2`  | 3:2 (landscape) | 1536×1024  |
| `3`  | 2:3 (portrait)  | 1024×1536  |

</details>

<details>
<summary>MAI-Image-1 (mdl=4)</summary>

| `ar` | Ratio           | Dimensions |
| ---- | --------------- | ---------- |
| `1`  | 1:1 (square)    | 1024×1024  |
| `2`  | 3:2 (landscape) | 1248×832   |
| `3`  | 2:3 (portrait)  | 832×1248   |

</details>

## Endpoints

### 1. Initiate generation

**Request:**

```http
POST /images/create?q={prompt}&rt=4&mdl={model}&ar={aspect}&FORM=GENCRE HTTP/1.1
Host: www.bing.com
Cookie: _U={cookie}
```

| Parameter | Required | Description                                   |
| --------- | -------- | --------------------------------------------- |
| `q`       | Yes      | URL-encoded prompt                            |
| `rt`      | Yes      | Request type. Use `4`                         |
| `mdl`     | No       | Model ID (`0`, `1`, or `4`). Default: `0`     |
| `ar`      | No       | Aspect ratio (`1`, `2`, or `3`). Default: `1` |
| `FORM`    | No       | Form identifier. Use `GENCRE`                 |

**Response:**

```http
HTTP/1.1 302 Found
Location: /images/create?q={prompt}&rt=4&mdl=0&ar=1&FORM=GENCRE&id={request_id}
```

Extract `id` from the redirect URL. Format: `1-{uuid}` (e.g.,
`1-6930d798aebe4d2a9d54027da1fdb513`)

**Errors:**

- No redirect ⇢ Authentication failed or invalid cookie

### 2. Poll for results

**Request:**

```http
GET /images/create/async/results/{request_id}?q={prompt}&mdl={model}&ar={aspect} HTTP/1.1
Host: www.bing.com
Cookie: _U={cookie}
```

| Parameter    | Required | Description               |
| ------------ | -------- | ------------------------- |
| `request_id` | Yes      | ID from initiation step   |
| `q`          | Yes      | Same prompt (URL-encoded) |
| `mdl`        | No       | Same model ID             |
| `ar`         | No       | Same aspect ratio         |

**Response:**

| Status | Body                     | Meaning                      |
| ------ | ------------------------ | ---------------------------- |
| 200    | Empty                    | Still generating, poll again |
| 200    | HTML                     | Generation complete          |
| 200    | JSON with `errorMessage` | Error occurred               |

**Polling interval:** 1-2 seconds  
**Typical wait:** 5-20 seconds (varies by model and load)

## Parsing results

The HTML response contains image URLs in `src` attributes:

```html
<img src="/th/id/OIG1.abc123?w=540&h=540&c=6&pid=ImgGn" />
```

### URL formats

**Relative (GPT-4o, MAI):**

```
/th/id/OIG3.abc123?w=540&h=540&pid=ImgGn
```

**Absolute (DALL-E 3):**

```
https://tse1.mm.bing.net/th/id/OIG1.abc123?pid=ImgGn
```

### URL normalization

The library normalizes all URLs to a consistent format:

1. Convert relative URLs to absolute:

   ```
   /th/id/OIG1.abc ⇢ https://www.bing.com/th/id/OIG1.abc
   ```

2. Convert CDN URLs to www:

   ```
   https://tse1.mm.bing.net/th/id/... ⇢ https://www.bing.com/th/id/...
   ```

3. For full resolution, use `?pid=ImgGn`:
   ```
   https://www.bing.com/th/id/OIG1.abc123?pid=ImgGn
   ```

### Image ID prefixes

| Prefix | Model              |
| ------ | ------------------ |
| `OIG1` | DALL-E 3           |
| `OIG2` | MAI-Image-1        |
| `OIG3` | GPT-4o             |
| `OIG4` | GPT-4o (alternate) |

## Error handling

### Content policy block

Bing blocks prompts that violate content policy at the **initiation stage**.
Instead of returning a 302 redirect, the POST request returns a 200 status with
an HTML page (the Bing Image Creator homepage). This means:

- No redirect URL ⇢ No request ID ⇢ Cannot poll for results
- The `initiateGeneration()` function throws: "No redirect received from Bing"

Blocked prompts include explicit content, violence, hate speech, and other
policy violations. There is no way to bypass this—the prompt must be modified.

### JSON error response

```json
{
  "errorMessage": "Description of the error"
}
```

### Common issues

| Symptom                        | Cause                                                       |
| ------------------------------ | ----------------------------------------------------------- |
| No redirect on POST (200 HTML) | Prompt blocked by content policy, or invalid/expired cookie |
| Empty response indefinitely    | Generation failed silently                                  |

## Complete flow example

```
1. POST /images/create?q=a+cat&rt=4&mdl=0&ar=1&FORM=GENCRE
   ⇢ 302 Redirect with id=1-abc123

2. GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
   ⇢ 200 (empty body, still processing)

3. GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
   ⇢ 200 (empty body, still processing)

4. GET /images/create/async/results/1-abc123?q=a+cat&mdl=0&ar=1
   ⇢ 200 HTML with 4 image URLs
```

## Notes

- Image URLs expire after some time (hours/days)
- The `rt=4` parameter appears required for all models
- Generation time: DALL-E 3 ≈ 5-15s, GPT-4o/MAI ≈ 20-70s

## Adding new models

When Bing adds new models:

1. Update `Model` const in `types.ts`
2. Add entry to `MODEL_CONFIGS` with:
   - `mdl` value (the API parameter)
   - `expectedImages` count
   - `aspectRatios` mapping
3. Test with both single and multiple image outputs
