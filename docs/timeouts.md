# Timeouts

`createImages` and `createVideo` take the same `options.timeouts` object. Every
field is optional.

| Field          | Default   | Meaning                                           |
| -------------- | --------- | ------------------------------------------------- |
| `generationMs` | `300_000` | Longest wait for the result, from the first poll. |
| `pollingMs`    | `1_000`   | Pause between two polls. Constant, no backoff.    |
| `requestMs`    | `30_000`  | Longest wait for one HTTP request.                |

The defaults are `DEFAULT_TIMEOUTS` in
[`src/shared/options.ts`](../src/shared/options.ts). Each value must be a finite
number of 0 or more, or the call throws.

`requestMs` covers the whole request, from sending it to reading the last byte
of the body. Each request waits for the smaller of `requestMs` and the
generation time left when it starts. A request cut short that way throws
`Request timed out after <ms>ms`, not the generation timeout. The pause between
polls is cut the same way, so the call never waits past `generationMs`. A video
round sends up to two requests. The second does not start when no generation
time is left. See [Errors](errors.md).

Set `generationMs` above the longest wait you expect. Observed waits are in
[Images](images.md#observed-not-verified).
