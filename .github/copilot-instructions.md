# Instructions

TS library wrapping Bing Image Creator's internal API. Generates images via
DALL-E 3, GPT-4o, MAI-Image-1. Handles authentication, request initiation,
polling, URL extraction.

Philosophy: simplicity as scaling strategy (explicit components), minimal
dependencies (pure fetch), code as documentation (comments should only be used
for non-obvious decisions or for JSDoc).

## Architecture

Core flow (src/client.ts): POST /images/create with mdl/ar params → extract
request ID from redirect → poll GET /images/create/async/results/{requestId}
until HTML returned → extract image URLs from HTML src attributes (src/parse.ts)
→ normalize URLs (decode entities, replace CDN tse\*.mm.bing.net with
www.bing.com, strip query params except pid) in src/url.ts.

Model config in src/constants.ts: mdl parameter maps models (0=dalle3, 1=gpt4o,
4=mai), aspect ratios to numeric codes (1=square, 2=landscape, 3=portrait).

Authentication via `_U` cookie from Bing session.

Three independent timeouts: generationMs (total limit, default 5min), pollingMs
(poll interval, default 1s), requestMs (per-request timeout, default 30s). Each
poll uses min(requestMs, remainingGenerationTime).

See .github/CONTRIBUTING.md for complete Bing API documentation including error
responses, content policy blocks, URL formats, model parameters.

## Development conventions

- Runtime: Bun (not Node.js). Use bun test/bun run build.
- Linting: Biome (not ESLint), formatter disabled (Prettier for md/yml only),
  configured in biome.json.
- Build: bunup (bunup.config.ts) outputs minified ESM + .d.ts to dist/.
- Version management: mise (mise.toml) locks Biome 2.3.8, Bun 1.3.3.
- File naming: all source files use .ts extension, import "./client.ts" not
  "./client". tsconfig.json has allowImportingTsExtensions=true, noEmit=true
  (Bun transpiles).
- Module resolution: bundler mode with verbatimModuleSyntax.
- Error patterns: include actionable context.
- Input validation: "Prompt must be a non-empty string".
- Authentication: "No redirect from Bing. Cookie may be invalid or expired."
- Timeout: "Image generation timed out after ${ms/1000}s".
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
Filter .js, .br.js, .svg from extracted URLs. Deduplicate after normalization.

Filename generation (src/filename.ts): slugify prompt (lowercase, replace
non-alphanumeric with -, trim 50 chars), append `_{index}.jpg`. Zero-based index
(first image = `_0.jpg`).

Polling: continue while response empty string. Stop on HTML or JSON (JSON
indicates error even if HTTP 200). No exponential backoff - constant pollingMs
interval.

## Workflows

```
bun test                # run tests
bun run check           # lint and format
bun run build           # build (runs check + bunup)
bun run clean           # remove dist/
```

## Public API

Export from src/index.ts only: createImages(prompt, options) function,
CreateImagesOptions/ImageResult types, Model/AspectRatio type aliases (not
enums, use string literals). Internal modules (src/parse.ts, src/url.ts,
src/filename.ts) not exposed but have unit tests.

## Markdown conventions

Use sentence case for headings. Avoid excessive heading hierarchy. Keep
structure flat where possible.
