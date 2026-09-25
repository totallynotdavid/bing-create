import { extractRequestId } from "../image/parse.ts";
import { fetchWithTimeout, sleep } from "../shared/http.ts";
import { extractVideoUrl } from "./parse.ts";
import { isPendingMessage } from "./parse.ts";

export async function initiateVideoGeneration(
  prompt: string,
  cookie: string,
  ar: number,
  timeoutMs: number,
): Promise<string> {
  const url = `https://www.bing.com/images/create/ai-video-generator?q=${encodeURIComponent(prompt)}&rt=4&mdl=0&ar=${ar}&FORM=GENCRE&hva=4&pt=4&sm=1`;

  const response = await fetchWithTimeout(url, cookie, timeoutMs, "POST");

  const redirectUrl = response.headers.get("location");
  if (!redirectUrl) {
    throw new Error("No redirect from Bing. Cookie may be invalid or expired.");
  }

  return extractRequestId(redirectUrl);
}

export async function pollForVideoUrl(
  prompt: string,
  requestId: string,
  cookie: string,
  ar: number,
  generationTimeoutMs: number,
  pollIntervalMs: number,
  requestTimeoutMs: number,
): Promise<string> {
  const asyncPollingUrl = `https://www.bing.com/images/create/async/results/${requestId}?q=${encodeURIComponent(prompt)}&mdl=0&ar=${ar}`;
  const resultUrl = new URL("https://www.bing.com/images/create/ai-video-generator");
  resultUrl.searchParams.set("q", prompt);
  resultUrl.searchParams.set("id", requestId);
  resultUrl.searchParams.set("rt", "4");
  resultUrl.searchParams.set("pt", "4");
  resultUrl.searchParams.set("FORM", "GUH2CR");
  resultUrl.searchParams.set("dmreload", "1");

  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= generationTimeoutMs) {
      throw new Error(`Video generation timed out after ${generationTimeoutMs / 1000}s`);
    }

    const remainingTime = generationTimeoutMs - elapsed;
    const timeoutForThisRequest = Math.min(requestTimeoutMs, remainingTime);

    const asyncResponse = await fetchWithTimeout(
      asyncPollingUrl,
      cookie,
      timeoutForThisRequest,
      "GET",
    );

    if (!asyncResponse.ok) {
      throw new Error(`HTTP ${asyncResponse.status}: ${asyncResponse.statusText}`);
    }

    const asyncText = await asyncResponse.text();
    const videoFromAsync = extractVideoUrl(asyncText);
    if (videoFromAsync) {
      return videoFromAsync;
    }

    if (asyncText.trim().startsWith("{")) {
      const json = JSON.parse(asyncText) as { errorMessage?: string };
      if (json.errorMessage && !isPendingMessage(json.errorMessage)) {
        throw new Error(`Bing error: ${json.errorMessage}`);
      }
    }

    const resultResponse = await fetchWithTimeout(
      resultUrl.toString(),
      cookie,
      timeoutForThisRequest,
      "GET",
    );

    if (!resultResponse.ok) {
      throw new Error(`HTTP ${resultResponse.status}: ${resultResponse.statusText}`);
    }

    const resultText = await resultResponse.text();
    const videoFromResult = extractVideoUrl(resultText);
    if (videoFromResult) {
      return videoFromResult;
    }

    await sleep(pollIntervalMs);
  }
}
