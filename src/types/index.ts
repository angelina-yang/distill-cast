export type ContentType = "youtube" | "article";

export type ItemStatus =
  | "queued"
  | "extracting"
  | "summarizing"
  | "generating-audio"
  | "ready"
  | "error";

export interface PlaylistItem {
  id: string;
  url: string;
  type: ContentType;
  title: string;
  content: string;
  summary: string;
  introAudioUrl: string | null;
  audioUrl: string | null;
  status: ItemStatus;
  error?: string;
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
