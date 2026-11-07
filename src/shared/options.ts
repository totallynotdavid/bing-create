import type { Timeouts } from "../types.ts";

export type ResolvedTimeouts = Required<Timeouts>;

const DEFAULT_TIMEOUTS: ResolvedTimeouts = {
  generationMs: 300_000,
  pollingMs: 1_000,
  requestMs: 30_000,
};

export function validate(prompt: unknown, cookie: unknown): void {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt must be a non-empty string");
  }
  if (typeof cookie !== "string" || !cookie.trim()) {
    throw new Error(
      "options.cookie is required and must be a non-empty string",
    );
  }
}

/** Returns `value`, or `fallback` when it is `undefined`. Throws otherwise. */
export function oneOf<T extends string>(
  name: string,
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value === undefined) {
    return fallback;
  }
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error(`options.${name} must be one of: ${allowed.join(", ")}`);
  }
  return match;
}

export function resolveTimeouts(timeouts?: Timeouts): ResolvedTimeouts {
  const resolved = { ...DEFAULT_TIMEOUTS };
  for (const key of Object.keys(DEFAULT_TIMEOUTS) as (keyof Timeouts)[]) {
    const value = timeouts?.[key];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(
        `options.timeouts.${key} must be a finite number of 0 or more`,
      );
    }
    resolved[key] = value;
  }
  return resolved;
}
