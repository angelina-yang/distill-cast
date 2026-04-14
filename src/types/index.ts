export type ContentType = "youtube" | "article";

export type ItemStatus =
  | "queued"
  | "extracting"
  | "summarizing"
  | "generating-audio"
  | "ready"
  | "error";

export type ReadMode = "summary" | "full";

export interface PlaylistItem {
  id: string;
  url: string;
  type: ContentType;
  title: string;
  content: string;
  summary: string;
  readMode: ReadMode;
  introAudioUrl: string | null;
  audioUrl: string | null;
  status: ItemStatus;
  error?: string;
  done: boolean;
}

export interface ExtractResult {
  title: string;
  content: string;
  type: ContentType;
  url: string;
}

export interface SummarizeResult {
  summary: string;
}
