# Contributing

For the code layout, read [architecture](../docs/architecture.md).

## Set up

Install [mise](https://mise.jdx.dev/getting-started.html). It installs the Bun
and Node.js versions pinned in `mise.toml`.

```bash
git clone https://github.com/totallynotdavid/bing-create.git
cd bing-create
mise install
bun run setup
```

## Check a change

```bash
bun run check              # read-only: lint, typecheck, unit tests, build
bun run fix                # rewrite files to pass lint
bun run lint               # Biome on code and JSON, oxfmt on md and yml
bun run typecheck          # tsc --noEmit
bun run test               # unit tests, without the integration tests
bun run test:integration   # calls Bing; needs a cookie
bun run build              # bunup builds dist/
```

CI runs `check` on every pull request and every push to `master`, and before a
release is published. To publish a release, read [releasing](RELEASING.md).

The integration tests call Bing and need a cookie. Copy `.env.example` to
`.env`, set `BING_COOKIE` ([how](../docs/authentication.md)) and run
`bun run test:integration`. A weekly workflow runs every test with a repository
secret.

## Code style

- Biome lints and formats the code (`biome.json`): double quotes, two-space
  indent, 80 columns.
- oxfmt formats Markdown and YAML at 80 columns with `proseWrap` always
  (`.oxfmtrc.json`).
- Imports include the `.ts` extension: `import { x } from "./client.ts"`.
- Public types are string-literal unions (`Model`, `AspectRatio` in
  `src/types.ts`), not enums. Use plain functions, not classes.
- Throw `Error` with a message that names the cause.
- Tests use `bun:test`. Assert behavior and the thrown message. Keep parsing and
  URL tests offline; put anything that calls Bing in
  `tests/integration.test.ts`.

## Add a model

1. Add the name to `Model` in `src/types.ts`.
2. Add an entry to `MODEL_CONFIGS` in `src/constants.ts` with its `mdl` value
   and an `aspectRatioMap` that maps `square`, `landscape` and `portrait` to the
   `ar` codes `1`, `2` and `3`.
3. Run `createImages` with the model and check the number of URLs it returns.
4. Add the model to the tables in [Images](../docs/images.md) and
   [Bing API](../docs/bing-api.md).
