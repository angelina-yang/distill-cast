"use client";

import { PlaylistItem, ItemStatus } from "@/types";

const STATUS_ICONS: Record<ItemStatus, string> = {
  queued: "hourglass",
  extracting: "spinner",
  summarizing: "spinner",
  "generating-audio": "spinner",
  ready: "ready",
  error: "error",
};

interface SidebarPlaylistProps {
  items: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  onItemClick: (index: number) => void;
}

export function SidebarPlaylist({
  items,
  currentIndex,
  isPlaying,
  onItemClick,
}: SidebarPlaylistProps) {
  if (items.length === 0) return null;

  return (
    <div className="w-80 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Playlist
        </h2>
        <p className="text-xs text-zinc-600 mt-1">
          {items.filter((i) => i.status === "ready").length} of {items.length} ready
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isReady = item.status === "ready";
          const isSpinning =
            item.status === "extracting" ||
            item.status === "summarizing" ||
            item.status === "generating-audio";

          return (
            <button
              key={item.id}
              onClick={() => isReady && onItemClick(index)}
              disabled={!isReady}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors flex items-start gap-3 ${
                isCurrent
                  ? "bg-violet-950/40 border-l-2 border-l-violet-500"
                  : isReady
                    ? "hover:bg-zinc-900 cursor-pointer"
                    : "opacity-50 cursor-default"
              }`}
            >
              {/* Track number / status icon */}
              <div className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                {isCurrent && isPlaying ? (
                  <div className="flex items-end gap-0.5 h-4">
                    <div className="w-1 bg-violet-400 rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
                    <div className="w-1 bg-violet-400 rounded-full animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
                    <div className="w-1 bg-violet-400 rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
                  </div>
                ) : isSpinning ? (
                  <div className="w-4 h-4 border-2 border-zinc-500 border-t-violet-400 rounded-full animate-spin" />
                ) : item.status === "error" ? (
                  <span className="text-red-400 text-xs">!</span>
                ) : (
                  <span className="text-zinc-500 text-sm font-mono">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Title and status */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm truncate ${
                    isCurrent ? "text-white font-medium" : "text-zinc-300"
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-zinc-600 truncate mt-0.5">
                  {item.type === "youtube" ? "YouTube" : "Article"}
                  {item.status === "error" && (
                    <span className="text-red-400 ml-1">- Failed</span>
                  )}
                  {isSpinning && (
                    <span className="text-violet-400 ml-1">
                      - {item.status === "extracting"
                        ? "Extracting"
                        : item.status === "summarizing"
                          ? "Summarizing"
                          : "Generating audio"}
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
