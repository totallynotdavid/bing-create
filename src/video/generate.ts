import { getText, pollUntil } from "../shared/http.ts";
import type { ResolvedTimeouts } from "../shared/options.ts";
import { startGeneration } from "../shared/request.ts";
import { extractVideoUrl, isPendingMessage } from "./parse.ts";

export function initiateVideoGeneration(
  prompt: string,
  cookie: string,
  ar: number,
  timeoutMs: number,
): Promise<string> {
  const url = `https://www.bing.com/images/create/ai-video-generator?q=${encodeURIComponent(prompt)}&rt=4&mdl=0&ar=${ar}&FORM=GENCRE&hva=4&pt=4&sm=1`;

  return startGeneration(url, cookie, timeoutMs);
}

export function pollForVideoUrl(
  prompt: string,
  requestId: string,
  cookie: string,
  ar: number,
  timeouts: ResolvedTimeouts,
): Promise<string> {
  const asyncPollingUrl = `https://www.bing.com/images/create/async/results/${requestId}?q=${encodeURIComponent(prompt)}&mdl=0&ar=${ar}`;
  const resultUrl = new URL(
    "https://www.bing.com/images/create/ai-video-generator",
  );
  resultUrl.searchParams.set("q", prompt);
  resultUrl.searchParams.set("id", requestId);
  resultUrl.searchParams.set("rt", "4");
  resultUrl.searchParams.set("pt", "4");
  resultUrl.searchParams.set("FORM", "GUH2CR");
  resultUrl.searchParams.set("dmreload", "1");

  return pollUntil("Video", timeouts, async (requestTimeoutMs) => {
    const asyncText = await getText(asyncPollingUrl, cookie, requestTimeoutMs);
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

    const resultText = await getText(
      resultUrl.toString(),
      cookie,
      requestTimeoutMs,
    );
    return extractVideoUrl(resultText) ?? undefined;
  });
}
