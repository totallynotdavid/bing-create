export type Model = "dalle3" | "gpt4o" | "mai";
export type AspectRatio = "square" | "landscape" | "portrait";
export type VideoAspectRatio = "portrait" | "landscape";

export interface Timeouts {
  generationMs?: number;
  pollingMs?: number;
  requestMs?: number;
}

export interface CreateImagesOptions {
  cookie: string;
  model?: Model;
  aspectRatio?: AspectRatio;
  timeouts?: Timeouts;
}

export interface ImageResult {
  url: string;
  suggestedFilename: string;
}

export interface CreateVideoOptions {
  cookie: string;
  aspectRatio?: VideoAspectRatio;
  timeouts?: Timeouts;
}
