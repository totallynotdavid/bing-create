# Instructions

TS library wrapping Bing Image Creator's internal API. Generates images via
DALL-E 3, GPT-4o, MAI-Image-1. Handles authentication, request initiation,
polling, URL extraction.

Philosophy: simplicity as scaling strategy (explicit components), minimal
dependencies (pure fetch), code as documentation (comments should only be used
for non-obvious decisions or for JSDoc).

## Architecture

Core flow (src/client.ts `createImages`): validate input and resolve timeouts
(src/shared/options.ts) → POST /images/create with mdl/ar params → extract
request ID from redirect (src/shared/request.ts) → poll GET
/images/create/async/results/{requestId} until HTML returned (src/shared/http.ts
`pollUntil`, src/image/generate.ts) → extract image URLs from HTML src
attributes (src/image/parse.ts) → normalize URLs (decode entities, replace CDN
tse\*.mm.bing.net with www.bing.com, strip query params except pid) in
src/image/url.ts.

`createVideo` follows the same flow with src/video/: POST to
/images/create/ai-video-generator, poll the async endpoint, and fall back to the
result page. It returns the video URL.

Model config in src/constants.ts: `MODEL_CONFIGS` maps each `Model` (dalle3,
gpt4o, mai) to its `mdl` parameter (0, 1, 4) and an `aspectRatioMap` from aspect
ratios to numeric codes (1=square, 2=landscape, 3=portrait).

Authentication via `_U` cookie from Bing session.

Three independent timeouts, the exported `Timeouts` type: generationMs (total
limit, default 5min), pollingMs (poll interval, default 1s), requestMs
(per-request timeout, default 30s). Defaults live in `resolveTimeouts`. Each
poll uses min(requestMs, remainingGenerationTime).

See .github/CONTRIBUTING.md for complete Bing API documentation including error
responses, content policy blocks, URL formats, model parameters.

## Development conventions

- Runtime: Bun (not Node.js). Use bun test/bun run build.
- Linting and formatting: Biome (not ESLint), configured in biome.json. Prettier
  (via bunx, not a dependency) formats md/yml only.
- Build: bunup (bunup.config.ts) outputs minified ESM + .d.ts to dist/.
- Version management: mise (mise.toml) locks Biome 2.5.14, Bun 1.4.2. The
  published package runs on Node >=22 (`engines`).
- File naming: all source files use .ts extension, import "./client.ts" not
  "./client". tsconfig.json has allowImportingTsExtensions=true, noEmit=true
  (Bun transpiles).
- Module resolution: bundler mode with verbatimModuleSyntax.
- Error patterns: include actionable context.
- Input validation: "Prompt must be a non-empty string".
- Authentication: "No redirect from Bing. Cookie may be invalid or expired."
- Timeout: "Image generation timed out after ${ms/1000}s" ("Video" for
  createVideo).
- JSON errors: "Bing error: ${json.errorMessage}".
- Testing: Bun test runner with promise-based assertions
  `return expect(createImages("", { cookie: "x" })).rejects.toThrow("expected message")`.
  Separate unit tests (parsing/URL utilities) from integration tests. Validate
  success and error conditions.
- Type safety: strict TypeScript with noUncheckedIndexedAccess, noUnusedLocals,
  noUnusedParameters. Use optional chaining, nullish coalescing for type
  narrowing.

## Implementation details

URL normalization: CDN URLs (`tse*.mm.bing.net`) sometimes 403 → always rewrite
to www.bing.com/th/id/. Only preserve pid query param, default to pid=ImgGn.
Filter .js, .br.js, .svg by URL path and keep only https URLs on bing.com or a
subdomain under /th/id/. Deduplicate after normalization. `extractImageUrls`
throws "No images found in response" when nothing is left.

Filename generation (src/image/filename.ts): slugify prompt (lowercase, replace
non-alphanumeric with -, trim 50 chars), append `_{index}.jpg`. Zero-based index
(first image = `_0.jpg`).

Polling (`pollUntil`): images continue while the response is an empty string and
stop on HTML or JSON (JSON indicates error even if HTTP 200). Video reads the
video URL from the async body; when it has none, pending JSON (`errorMessage`
"pending" or "still pending") or an empty body falls back to requesting the
result page, and any other `errorMessage` is an error. No exponential backoff -
constant pollingMs interval.

## Workflows

```
bun test                # run tests
bun run check           # read-only lint and format check
bun run format          # rewrite files to pass check
bun run build           # build with bunup
bun run clean           # remove dist/
```

## Public API

Export from src/index.ts only: createImages(prompt, options) and
createVideo(prompt, options) functions, CreateImagesOptions/CreateVideoOptions/
ImageResult/Timeouts types, Model/AspectRatio/VideoAspectRatio type aliases (not
enums, use string literals). Internal modules (src/image/, src/video/,
src/shared/) not exposed but have unit tests.

## Markdown conventions

Use sentence case for headings. Avoid excessive heading hierarchy. Keep
structure flat where possible.
