import type {
  AspectRatio,
  CreateImagesOptions,
  CreateVideoOptions,
  ImageResult,
  Model,
  VideoAspectRatio,
} from "./types.ts";
import { MODEL_CONFIGS } from "./constants.ts";
import { oneOf, resolveTimeouts, validate } from "./shared/options.ts";
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
  validate(prompt, options?.cookie);

  const model = oneOf(
    "model",
    options.model,
    Object.keys(MODEL_CONFIGS) as Model[],
    "dalle3",
  );
  const config = MODEL_CONFIGS[model];
  const aspectRatio = oneOf(
    "aspectRatio",
    options.aspectRatio,
    Object.keys(config.aspectRatioMap) as AspectRatio[],
    "square",
  );
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
  validate(prompt, options?.cookie);

  const aspectRatio = oneOf(
    "aspectRatio",
    options.aspectRatio,
    Object.keys(VIDEO_ASPECT_RATIO_MAP) as VideoAspectRatio[],
    "portrait",
  );
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
