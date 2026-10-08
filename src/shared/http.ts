import { USER_AGENT } from "../constants.ts";
import type { ResolvedTimeouts } from "./options.ts";

export async function fetchWithTimeout(
  url: string,
  cookie: string,
  timeoutMs: number,
  method: "GET" | "POST",
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        cookie: `_U=${cookie}`,
        "user-agent": USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export async function getText(
  url: string,
  cookie: string,
  timeoutMs: number,
): Promise<string> {
  const response = await fetchWithTimeout(url, cookie, timeoutMs, "GET");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Repeats while `round` returns `undefined` and caps each request at the
 * remaining generation time.
 */
export async function pollUntil<T>(
  kind: string,
  timeouts: ResolvedTimeouts,
  round: (requestTimeoutMs: number) => Promise<T | undefined>,
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const remainingMs = timeouts.generationMs - (Date.now() - startTime);
    if (remainingMs <= 0) {
      throw new Error(
        `${kind} generation timed out after ${timeouts.generationMs / 1000}s`,
      );
    }

    const result = await round(Math.min(timeouts.requestMs, remainingMs));
    if (result !== undefined) {
      return result;
    }

    await sleep(timeouts.pollingMs);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
