import { extractRequestId } from "./parse.ts";
import { fetchWithTimeout, sleep } from "../shared/http.ts";

export async function initiateGeneration(
  prompt: string,
  cookie: string,
  mdl: number,
  ar: number,
  timeoutMs: number,
): Promise<string> {
  const url = `https://www.bing.com/images/create?q=${encodeURIComponent(prompt)}&rt=4&mdl=${mdl}&ar=${ar}&FORM=GENCRE`;

  const response = await fetchWithTimeout(url, cookie, timeoutMs, "POST");

  const redirectUrl = response.headers.get("location");
  if (!redirectUrl) {
    throw new Error("No redirect from Bing. Cookie may be invalid or expired.");
  }

  return extractRequestId(redirectUrl);
}

export async function pollForResults(
  prompt: string,
  requestId: string,
  cookie: string,
  mdl: number,
  ar: number,
  generationTimeoutMs: number,
  pollIntervalMs: number,
  requestTimeoutMs: number,
): Promise<string> {
  const pollingUrl = `https://www.bing.com/images/create/async/results/${requestId}?q=${encodeURIComponent(prompt)}&mdl=${mdl}&ar=${ar}`;
  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= generationTimeoutMs) {
      throw new Error(`Image generation timed out after ${generationTimeoutMs / 1000}s`);
    }

    const remainingTime = generationTimeoutMs - elapsed;
    const timeoutForThisRequest = Math.min(requestTimeoutMs, remainingTime);

    const response = await fetchWithTimeout(
      pollingUrl,
      cookie,
      timeoutForThisRequest,
      "GET",
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    if (!text) {
      await sleep(pollIntervalMs);
      continue;
    }

    if (text.trim().startsWith("{")) {
      const json = JSON.parse(text);
      if (json.errorMessage) {
        throw new Error(`Bing error: ${json.errorMessage}`);
      }
      throw new Error(`Unexpected JSON response from Bing: ${text.slice(0, 200)}`);
    }

    return text;
  }
}
