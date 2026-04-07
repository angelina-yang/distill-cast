"use client";

import { PlaylistItem } from "@/types";
import { ProgressBar } from "./progress-bar";

interface AudioPlayerProps {
  currentItem: PlaylistItem | null;
  isPlaying: boolean;
  playingIntro: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onSeek: (time: number) => void;
}

export function AudioPlayer({
  currentItem,
  isPlaying,
  playingIntro,
  currentTime,
  duration,
  onTogglePlayPause,
  onSkipNext,
  onSkipPrevious,
  onSeek,
}: AudioPlayerProps) {
  if (!currentItem) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-4 py-3 z-50">
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-4">
            <p className="text-sm text-white truncate">{currentItem.title}</p>
            {playingIntro && (
              <p className="text-xs text-violet-400">Playing intro...</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSkipPrevious}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={onTogglePlayPause}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={onSkipNext}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Next"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
      </div>
    </div>
  );
}
