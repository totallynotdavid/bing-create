# Agent instructions

bing-create is a TypeScript library for Bing Image Creator. Read the
[readme](readme.md) for what it does and
[docs/architecture.md](docs/architecture.md) for the code map. The Bing requests
and the URL rules are in [docs/bing-api.md](docs/bing-api.md); do not restate
them elsewhere.

The commands to test, check and build, and the code style, are in
[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md). Follow them.

## Rules

- Use Bun, not npm or Node.js, to install, test and build.
- Add no runtime dependency. Requests use the global `fetch`
  (`src/shared/http.ts`).
- Export only from `src/index.ts`.
- Comment only a non-obvious decision, or write JSDoc.
- Keep `parse.ts`, `url.ts` and `filename.ts` pure.
- Markdown: sentence-case headings and a flat structure.
- Change a document in the same change as the behavior it describes.
