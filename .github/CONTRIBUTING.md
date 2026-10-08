# Contributing

For the code layout, read [architecture](../docs/architecture.md).

## Set up

Install [mise](https://mise.jdx.dev/getting-started.html). It installs the Bun
and Biome versions pinned in `mise.toml`.

```bash
git clone https://github.com/totallynotdavid/bing-create.git
cd bing-create
mise install
bun install
```

## Check a change

```bash
bun test              # unit tests; integration tests skip without a cookie
bun run check         # read-only: Biome lint and format, Prettier on md and yml
bun run format        # rewrite files to pass check
bun run build         # bunup builds dist/
bun run clean         # remove dist/
```

`bun run test` is the same as `bun test` and also loads `.env`.

CI runs `check`, `bun test` and `build` on every pull request and every push to
`master`, and before a release is published.

The integration tests call Bing and need a cookie. Copy `.env.example` to
`.env`, set `BING_COOKIE` ([how](../docs/authentication.md)) and run `bun test`.
A weekly workflow runs them with a repository secret.

## Code style

- Biome lints and formats the code (`biome.json`): double quotes, two-space
  indent, 80 columns.
- Prettier formats Markdown and YAML at 80 columns with `prose-wrap always`. The
  scripts run it through `bunx`; it is not a dependency.
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
