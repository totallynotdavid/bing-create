import type { Timeouts } from "../types.ts";

export type ResolvedTimeouts = Required<Timeouts>;

const DEFAULT_TIMEOUTS: ResolvedTimeouts = {
  generationMs: 300_000,
  pollingMs: 1_000,
  requestMs: 30_000,
};

export function validate(prompt: string, cookie: string): void {
  if (!prompt?.trim()) {
    throw new Error("Prompt must be a non-empty string");
  }
  if (!cookie?.trim()) {
    throw new Error(
      "options.cookie is required and must be a non-empty string",
    );
  }
}

export function resolveTimeouts(timeouts?: Timeouts): ResolvedTimeouts {
  return {
    generationMs: timeouts?.generationMs ?? DEFAULT_TIMEOUTS.generationMs,
    pollingMs: timeouts?.pollingMs ?? DEFAULT_TIMEOUTS.pollingMs,
    requestMs: timeouts?.requestMs ?? DEFAULT_TIMEOUTS.requestMs,
  };
}
