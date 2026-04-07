"use client";

import { useState } from "react";
import { PlaylistItem } from "@/types";

interface SidebarPlaylistProps {
  items: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  onItemClick: (index: number) => void;
  onToggleDone: (id: string) => void;
  onRemoveItem: (id: string) => void;
}

export function SidebarPlaylist({
  items,
  currentIndex,
  isPlaying,
  onItemClick,
  onToggleDone,
  onRemoveItem,
}: SidebarPlaylistProps) {
  const [showDone, setShowDone] = useState(false);

  if (items.length === 0) return null;

  const activeItems = items.filter((i) => !i.done);
  const doneItems = items.filter((i) => i.done);

  return (
    <div className="w-80 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Playlist
        </h2>
        <p className="text-xs text-zinc-600 mt-1">
          {activeItems.filter((i) => i.status === "ready").length} ready
          {doneItems.length > 0 && ` · ${doneItems.length} done`}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Active items */}
        {activeItems.map((item) => {
          const globalIndex = items.indexOf(item);
          const isCurrent = globalIndex === currentIndex;
          const isReady = item.status === "ready";
          const isSpinning =
            item.status === "extracting" ||
            item.status === "summarizing" ||
            item.status === "generating-audio";

          return (
            <div
              key={item.id}
              className={`group relative border-b border-zinc-800/50 transition-colors ${
                isCurrent
                  ? "bg-violet-950/40 border-l-2 border-l-violet-500"
                  : isReady
                    ? "hover:bg-zinc-900"
                    : "opacity-50"
              }`}
            >
              <button
                onClick={() => isReady && onItemClick(globalIndex)}
                disabled={!isReady}
                className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer disabled:cursor-default"
              >
                {/* Status icon */}
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
                    <span className="text-red-400 text-xs font-bold">!</span>
                  ) : (
                    <span className="text-zinc-500 text-sm font-mono">
                      {activeItems.indexOf(item) + 1}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isCurrent ? "text-white font-medium" : "text-zinc-300"}`}>
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

              {/* Action buttons — show on hover */}
              {isReady && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleDone(item.id); }}
                    className="p-1 text-zinc-500 hover:text-green-400 transition-colors"
                    title="Mark as done"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Done section */}
        {doneItems.length > 0 && (
          <>
            <button
              onClick={() => setShowDone(!showDone)}
              className="w-full px-4 py-2 flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-400 border-b border-zinc-800/50 bg-zinc-950"
            >
              <span>Done ({doneItems.length})</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${showDone ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showDone &&
              doneItems.map((item) => {
                const globalIndex = items.indexOf(item);
                return (
                  <div
                    key={item.id}
                    className="group relative border-b border-zinc-800/50 opacity-50 hover:opacity-75 transition-opacity"
                  >
                    <button
                      onClick={() => onItemClick(globalIndex)}
                      className="w-full text-left px-4 py-2 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="text-sm text-zinc-500 truncate line-through">
                        {item.title}
                      </p>
                    </button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleDone(item.id); }}
                        className="p-1 text-zinc-500 hover:text-yellow-400 transition-colors"
                        title="Move back to playlist"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 14l-4-4 4-4" />
                          <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}
