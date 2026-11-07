import { afterEach } from "bun:test";

type Handler = (
  url: URL,
  method: string,
  signal: AbortSignal | null | undefined,
) => Response | Promise<Response>;

const realFetch = globalThis.fetch;

/** Stubs only the network boundary. Code above `fetch` runs for real. */
export function stubBing(handler: Handler): { requests: string[] } {
  const requests: string[] = [];

  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const method = init?.method ?? "GET";
    requests.push(`${method} ${url.pathname}`);
    return Promise.resolve(handler(url, method, init?.signal));
  }) as typeof fetch;

  return { requests };
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

export function redirect(id: string): Response {
  return new Response(null, {
    status: 302,
    headers: { location: `/images/create?q=x&rt=4&id=${id}` },
  });
}

/** Headers arrive at once; the body never ends and errors when aborted. */
export function stalledBody(signal: AbortSignal | null | undefined): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        signal?.addEventListener("abort", () =>
          controller.error(new DOMException("aborted", "AbortError")),
        );
      },
    }),
  );
}

/** Resolves with `response` after `ms`, or rejects when aborted first. */
export function after(
  ms: number,
  signal: AbortSignal | null | undefined,
  response: Response,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(response), ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}
