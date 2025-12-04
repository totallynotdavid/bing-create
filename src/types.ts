export const Model = {
  DALLE3: "dalle3",
  GPT4O: "gpt4o",
  MAI: "mai",
} as const;

export type ModelType = (typeof Model)[keyof typeof Model];

export const AspectRatio = {
  SQUARE: "square",
  LANDSCAPE: "landscape",
  PORTRAIT: "portrait",
} as const;

export type AspectRatioType = (typeof AspectRatio)[keyof typeof AspectRatio];

export interface Options {
  cookie: string;
  model?: ModelType;
  aspectRatio?: AspectRatioType;
  generationTimeoutMs?: number;
  pollIntervalMs?: number;
  requestTimeoutMs?: number;
}

export interface ImageResult {
  url: string;
  filename: string;
}

export interface ModelConfig {
  mdl: number;
  expectedImages: number;
  aspectRatios: Record<AspectRatioType, number>;
}

export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  [Model.DALLE3]: {
    mdl: 0,
    expectedImages: 4,
    aspectRatios: {
      [AspectRatio.SQUARE]: 1,
      [AspectRatio.LANDSCAPE]: 2,
      [AspectRatio.PORTRAIT]: 3,
    },
  },
  [Model.GPT4O]: {
    mdl: 1,
    expectedImages: 1,
    aspectRatios: {
      [AspectRatio.SQUARE]: 1,
      [AspectRatio.LANDSCAPE]: 2,
      [AspectRatio.PORTRAIT]: 3,
    },
  },
  [Model.MAI]: {
    mdl: 4,
    expectedImages: 1,
    aspectRatios: {
      [AspectRatio.SQUARE]: 1,
      [AspectRatio.LANDSCAPE]: 2,
      [AspectRatio.PORTRAIT]: 3,
    },
  },
};
