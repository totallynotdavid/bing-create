import { afterEach } from "bun:test";

type Handler = (url: URL, method: string) => Response;

const realFetch = globalThis.fetch;

/** Stubs only the network boundary. Code above `fetch` runs for real. */
export function stubBing(handler: Handler): { requests: string[] } {
  const requests: string[] = [];

  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const method = init?.method ?? "GET";
    requests.push(`${method} ${url.pathname}`);
    return Promise.resolve(handler(url, method));
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
