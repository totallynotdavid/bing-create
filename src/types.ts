export type Model = "dalle3" | "gpt4o" | "mai";
export type AspectRatio = "square" | "landscape" | "portrait";
export type VideoAspectRatio = "portrait" | "landscape";

export interface CreateImagesOptions {
  cookie: string;
  model?: Model;
  aspectRatio?: AspectRatio;
  timeouts?: {
    generationMs?: number;
    pollingMs?: number;
    requestMs?: number;
  };
}

export interface ImageResult {
  url: string;
  suggestedFilename: string;
}

export interface CreateVideoOptions {
  cookie: string;
  aspectRatio?: VideoAspectRatio;
  timeouts?: {
    generationMs?: number;
    pollingMs?: number;
    requestMs?: number;
  };
}
