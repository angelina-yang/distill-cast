"use client";

import { PlaylistItem, ItemStatus } from "@/types";

const STATUS_LABELS: Record<ItemStatus, string> = {
  queued: "Queued",
  extracting: "Extracting content...",
  summarizing: "Summarizing...",
  "generating-audio": "Generating audio...",
  ready: "Ready",
  error: "Failed",
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  queued: "text-zinc-500",
  extracting: "text-yellow-400",
  summarizing: "text-blue-400",
  "generating-audio": "text-purple-400",
  ready: "text-green-400",
  error: "text-red-400",
};

interface ProcessingQueueProps {
  items: PlaylistItem[];
  currentIndex: number;
  onItemClick: (index: number) => void;
}

export function ProcessingQueue({
  items,
  currentIndex,
  onItemClick,
}: ProcessingQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => item.status === "ready" && onItemClick(index)}
          disabled={item.status !== "ready"}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            index === currentIndex
              ? "bg-violet-950/50 border-violet-500"
              : item.status === "ready"
                ? "bg-zinc-900 border-zinc-700 hover:border-zinc-500 cursor-pointer"
                : "bg-zinc-900 border-zinc-800 cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-zinc-500 text-sm font-mono w-6 shrink-0">
                {index + 1}
              </span>
              <span className="text-white truncate text-sm">{item.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(item.status === "extracting" ||
                item.status === "summarizing" ||
                item.status === "generating-audio") && (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin text-violet-400" />
              )}
              <span
                className={`text-xs font-medium ${STATUS_COLORS[item.status]}`}
              >
                {STATUS_LABELS[item.status]}
              </span>
            </div>
          </div>
          {item.status === "error" && item.error && (
            <p className="mt-2 ml-9 text-xs text-red-400/70">{item.error}</p>
          )}
        </button>
      ))}
    </div>
  );
}
