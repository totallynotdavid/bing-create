# Timeouts

`createImages` and `createVideo` take the same `options.timeouts` object. Every
field is optional.

| Field          | Default   | Meaning                                           |
| -------------- | --------- | ------------------------------------------------- |
| `generationMs` | `300_000` | Longest wait for the result, from the first poll. |
| `pollingMs`    | `1_000`   | Pause between two polls. Constant, no backoff.    |
| `requestMs`    | `30_000`  | Longest wait for one HTTP request.                |

The defaults are `DEFAULT_TIMEOUTS` in
[`src/shared/options.ts`](../src/shared/options.ts).

Each request waits for the smaller of `requestMs` and the generation time that
was left when the poll round started. A request cut short that way throws
`Request timed out after <ms>ms`, not the generation timeout. See
[Errors](errors.md).

An image round sends one request. A video round sends up to two with the same
limit, so `createVideo` can run past `generationMs` by up to twice the time that
was left.

Set `generationMs` above the longest wait you expect. Observed waits are in
[Images](images.md#observed-not-verified).
