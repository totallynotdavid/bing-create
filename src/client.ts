import type {
  CreateImagesOptions,
  CreateVideoOptions,
  ImageResult,
  VideoAspectRatio,
} from "./types.ts";
import { MODEL_CONFIGS } from "./constants.ts";
import { resolveTimeouts, validate } from "./shared/options.ts";
import { initiateGeneration, pollForResults } from "./image/generate.ts";
import { extractImageUrls } from "./image/parse.ts";
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
  validate(prompt, options.cookie);

  const model = options.model ?? "dalle3";
  const aspectRatio = options.aspectRatio ?? "square";
  const config = MODEL_CONFIGS[model];
  const ar = config.aspectRatioMap[aspectRatio];
  const timeouts = resolveTimeouts(options.timeouts);

  const requestId = await initiateGeneration(
    prompt,
    options.cookie,
    config.mdl,
    ar,
    timeouts.requestMs,
  );

  const html = await pollForResults(
    prompt,
    requestId,
    options.cookie,
    config.mdl,
    ar,
    timeouts,
  );

  return extractImageUrls(html).map((url, index) => ({
    url,
    suggestedFilename: generateFilename(prompt, index),
  }));
}

export async function createVideo(
  prompt: string,
  options: CreateVideoOptions,
): Promise<string> {
  validate(prompt, options.cookie);

  const aspectRatio = options.aspectRatio ?? "portrait";
  const ar = VIDEO_ASPECT_RATIO_MAP[aspectRatio];
  const timeouts = resolveTimeouts(options.timeouts);

  const requestId = await initiateVideoGeneration(
    prompt,
    options.cookie,
    ar,
    timeouts.requestMs,
  );

  return pollForVideoUrl(prompt, requestId, options.cookie, ar, timeouts);
}
