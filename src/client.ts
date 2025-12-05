import type { CreateImagesOptions, ImageResult } from "./types.ts";
import { MODEL_CONFIGS, DEFAULT_TIMEOUTS, USER_AGENT } from "./constants.ts";
import { extractRequestId, extractImageUrls } from "./parse.ts";
import { normalizeUrls } from "./url.ts";
import { generateFilename } from "./filename.ts";

export async function createImages(
  prompt: string,
  options: CreateImagesOptions,
): Promise<ImageResult[]> {
  if (!prompt?.trim()) {
    throw new Error("Prompt must be a non-empty string");
  }
  if (!options.cookie?.trim()) {
    throw new Error("options.cookie is required and must be a non-empty string");
  }

  const model = options.model ?? "dalle3";
  const aspectRatio = options.aspectRatio ?? "square";
  const config = MODEL_CONFIGS[model];

  const timeouts = {
    generation: options.timeouts?.generationMs ?? DEFAULT_TIMEOUTS.GENERATION_MS,
    polling: options.timeouts?.pollingMs ?? DEFAULT_TIMEOUTS.POLLING_MS,
    request: options.timeouts?.requestMs ?? DEFAULT_TIMEOUTS.REQUEST_MS,
  };

  const requestId = await initiateGeneration(
    prompt,
    options.cookie,
    config.mdl,
    config.aspectRatioMap[aspectRatio],
    timeouts.request,
  );

  const html = await pollForResults(
    prompt,
    requestId,
    options.cookie,
    config.mdl,
    config.aspectRatioMap[aspectRatio],
    timeouts.generation,
    timeouts.polling,
    timeouts.request,
  );

  const rawUrls = extractImageUrls(html);
  const cleanUrls = normalizeUrls(rawUrls);

  return cleanUrls.map((url, index) => ({
    url,
    suggestedFilename: generateFilename(prompt, index),
  }));
}

async function initiateGeneration(
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

async function pollForResults(
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

async function fetchWithTimeout(
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
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
