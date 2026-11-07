import { USER_AGENT } from "../constants.ts";
import type { ResolvedTimeouts } from "./options.ts";

/**
 * Sends one request and runs `read` on the response. The timer covers `read`,
 * so a body that stalls after the headers also times out.
 */
export async function request<T>(
  url: string,
  cookie: string,
  timeoutMs: number,
  method: "GET" | "POST",
  read: (response: Response) => Promise<T>,
): Promise<T> {
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

    return await read(response);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getText(
  url: string,
  cookie: string,
  timeoutMs: number,
): Promise<string> {
  return request(url, cookie, timeoutMs, "GET", (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  });
}

/**
 * Repeats while `round` returns `undefined`. `round` gets a function that
 * returns the timeout for its next request: `requestMs`, capped at the
 * generation time left. That function throws when no time is left.
 */
export async function pollUntil<T>(
  kind: string,
  timeouts: ResolvedTimeouts,
  round: (nextRequestMs: () => number) => Promise<T | undefined>,
): Promise<T> {
  const startTime = Date.now();
  const remainingMs = () => timeouts.generationMs - (Date.now() - startTime);
  const nextRequestMs = () => {
    const remaining = remainingMs();
    if (remaining <= 0) {
      throw new Error(
        `${kind} generation timed out after ${timeouts.generationMs / 1000}s`,
      );
    }
    return Math.min(timeouts.requestMs, remaining);
  };

  while (true) {
    nextRequestMs();

    const result = await round(nextRequestMs);
    if (result !== undefined) {
      return result;
    }

    await sleep(Math.max(0, Math.min(timeouts.pollingMs, remainingMs())));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
