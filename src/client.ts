import type {
  CreateImagesOptions,
  CreateVideoOptions,
  ImageResult,
  VideoAspectRatio,
} from "./types.ts";
import { MODEL_CONFIGS, DEFAULT_TIMEOUTS } from "./constants.ts";
import { initiateGeneration, pollForResults } from "./image/generate.ts";
import { extractImageUrls } from "./image/parse.ts";
import { normalizeUrls } from "./image/url.ts";
import { generateFilename } from "./image/filename.ts";
import { initiateVideoGeneration, pollForVideoUrl } from "./video/generate.ts";

const VIDEO_ASPECT_RATIO_MAP: Record<VideoAspectRatio, number> = {
  portrait: 4,
  landscape: 5,
};

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

export async function createVideo(
  prompt: string,
  options: CreateVideoOptions,
): Promise<string> {
  if (!prompt?.trim()) {
    throw new Error("Prompt must be a non-empty string");
  }
  if (!options.cookie?.trim()) {
    throw new Error("options.cookie is required and must be a non-empty string");
  }

  const aspectRatio = options.aspectRatio ?? "portrait";
  const ar = VIDEO_ASPECT_RATIO_MAP[aspectRatio];

  const timeouts = {
    generation: options.timeouts?.generationMs ?? DEFAULT_TIMEOUTS.GENERATION_MS,
    polling: options.timeouts?.pollingMs ?? DEFAULT_TIMEOUTS.POLLING_MS,
    request: options.timeouts?.requestMs ?? DEFAULT_TIMEOUTS.REQUEST_MS,
  };

  const requestId = await initiateVideoGeneration(
    prompt,
    options.cookie,
    ar,
    timeouts.request,
  );

  return pollForVideoUrl(
    prompt,
    requestId,
    options.cookie,
    ar,
    timeouts.generation,
    timeouts.polling,
    timeouts.request,
  );
}
