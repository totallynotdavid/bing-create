import { getText, pollUntil } from "../shared/http.ts";
import type { ResolvedTimeouts } from "../shared/options.ts";
import { startGeneration } from "../shared/request.ts";

export function initiateGeneration(
  prompt: string,
  cookie: string,
  mdl: number,
  ar: number,
  timeoutMs: number,
): Promise<string> {
  const url = `https://www.bing.com/images/create?q=${encodeURIComponent(prompt)}&rt=4&mdl=${mdl}&ar=${ar}&FORM=GENCRE`;

  return startGeneration(url, cookie, timeoutMs);
}

export function pollForResults(
  prompt: string,
  requestId: string,
  cookie: string,
  mdl: number,
  ar: number,
  timeouts: ResolvedTimeouts,
): Promise<string> {
  const pollingUrl = `https://www.bing.com/images/create/async/results/${requestId}?q=${encodeURIComponent(prompt)}&mdl=${mdl}&ar=${ar}`;

  return pollUntil("Image", timeouts, async (requestTimeoutMs) => {
    const text = await getText(pollingUrl, cookie, requestTimeoutMs);

    if (!text) {
      return undefined;
    }

    if (text.trim().startsWith("{")) {
      const json = JSON.parse(text);
      if (json.errorMessage) {
        throw new Error(`Bing error: ${json.errorMessage}`);
      }
      throw new Error(
        `Unexpected JSON response from Bing: ${text.slice(0, 200)}`,
      );
    }

    return text;
  });
}
