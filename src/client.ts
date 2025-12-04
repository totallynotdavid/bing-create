import type {
  Options,
  ImageResult,
  ModelConfig,
  AspectRatioType,
} from "./types";
import { Model, AspectRatio, MODEL_CONFIGS } from "./types";
import { extractRequestId, extractImageUrls } from "./parse";
import { generateFilename } from "./filename";

const DEFAULT_GENERATION_TIMEOUT_MS = 300_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

const BING_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";

/**
 * Generate images using Bing Image Creator
 *
 * @param prompt - Text description of images to generate
 * @param options - Configuration including authentication cookie
 * @returns Array of generated image metadata with URLs and suggested filenames
 *
 * @example
 * ```ts
 * const images = await createImages("a cat wearing a hat", {
 *   cookie: process.env.BING_AUTH_COOKIE!,
 *   model: Model.DALLE3,
 *   aspectRatio: AspectRatio.SQUARE,
 * });
 *
 * for (const image of images) {
 *   console.log(image.url, image.filename);
 * }
 * ```
 */
export async function createImages(
  prompt: string,
  options: Options,
): Promise<ImageResult[]> {
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }

  if (typeof options.cookie !== "string" || options.cookie.trim() === "") {
    throw new Error(
      "options.cookie is required and must be a non-empty string",
    );
  }

  const model = options.model ?? Model.DALLE3;
  const aspectRatio = options.aspectRatio ?? AspectRatio.SQUARE;
  const config = MODEL_CONFIGS[model];

  const generationTimeoutMs =
    options.generationTimeoutMs ?? DEFAULT_GENERATION_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const requestTimeoutMs =
    options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

  const requestId = await initiateGeneration(
    prompt,
    options.cookie,
    config,
    aspectRatio,
    requestTimeoutMs,
  );

  const imageUrls = await pollForResults(
    prompt,
    requestId,
    options.cookie,
    config,
    aspectRatio,
    generationTimeoutMs,
    pollIntervalMs,
    requestTimeoutMs,
  );

  return imageUrls.map((url, index) => ({
    url,
    filename: generateFilename(prompt, index),
  }));
}

async function bingFetch(
  url: string,
  cookie: string,
  timeoutMs: number,
  method: "GET" | "POST" = "POST",
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        cookie: `_U=${cookie}`,
        "user-agent": BING_USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en,es;q=0.9,en-US;q=0.8",
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

async function initiateGeneration(
  prompt: string,
  cookie: string,
  config: ModelConfig,
  aspectRatio: AspectRatioType,
  timeoutMs: number,
): Promise<string> {
  const ar = config.aspectRatios[aspectRatio];
  const url = `https://www.bing.com/images/create?q=${encodeURIComponent(prompt)}&rt=4&mdl=${config.mdl}&ar=${ar}&FORM=GENCRE`;

  const response = await bingFetch(url, cookie, timeoutMs);

  const redirectUrl = response.headers.get("location");
  if (!redirectUrl) {
    throw new Error(
      "No redirect received from Bing. Cookie may be invalid or expired.",
    );
  }

  return extractRequestId(redirectUrl);
}

async function pollForResults(
  prompt: string,
  requestId: string,
  cookie: string,
  config: ModelConfig,
  aspectRatio: AspectRatioType,
  generationTimeoutMs: number,
  pollIntervalMs: number,
  requestTimeoutMs: number,
): Promise<string[]> {
  const ar = config.aspectRatios[aspectRatio];
  const pollingUrl = `https://www.bing.com/images/create/async/results/${requestId}?q=${encodeURIComponent(prompt)}&mdl=${config.mdl}&ar=${ar}`;
  const startTime = Date.now();

  while (Date.now() - startTime < generationTimeoutMs) {
    const response = await bingFetch(
      pollingUrl,
      cookie,
      requestTimeoutMs,
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
      try {
        const json = JSON.parse(text) as { errorMessage?: string };
        if (json.errorMessage) {
          throw new Error(`Bing error: ${json.errorMessage}`);
        }
      } catch (_parseError) {
        // Not JSON or no error field, continue to HTML parsing
      }
    }

    return extractImageUrls(text);
  }

  throw new Error(
    `Image generation timed out after ${generationTimeoutMs / 1000} seconds`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
