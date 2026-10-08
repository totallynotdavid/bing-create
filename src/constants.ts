import type { Model, AspectRatio } from "./types.ts";

interface ModelConfig {
  mdl: number;
  aspectRatioMap: Record<AspectRatio, number>;
}

export const MODEL_CONFIGS: Record<Model, ModelConfig> = {
  dalle3: {
    mdl: 0,
    aspectRatioMap: { square: 1, landscape: 2, portrait: 3 },
  },
  gpt4o: {
    mdl: 1,
    aspectRatioMap: { square: 1, landscape: 2, portrait: 3 },
  },
  mai: {
    mdl: 4,
    aspectRatioMap: { square: 1, landscape: 2, portrait: 3 },
  },
};

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
