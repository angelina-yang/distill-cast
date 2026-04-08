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
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onReplay: () => void;
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
  onSkipForward,
  onSkipBackward,
  onReplay,
  onSeek,
}: AudioPlayerProps) {
  if (!currentItem) return null;

  const isReady = currentItem.status === "ready";
  const statusLabel =
    currentItem.status === "extracting"
      ? "Extracting content..."
      : currentItem.status === "summarizing"
        ? "Summarizing..."
        : currentItem.status === "generating-audio"
          ? "Generating audio..."
          : playingIntro
            ? "Playing intro..."
            : null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 px-3 md:px-4 py-2 md:py-3 z-50"
      style={{
        background: "var(--bg-player)",
        borderTop: "1px solid var(--border-primary)",
      }}
    >
      <div className="max-w-2xl mx-auto space-y-1.5 md:space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3 md:mr-4">
            <p className="text-xs md:text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {currentItem.title}
            </p>
            {statusLabel && (
              <p className="text-xs" style={{ color: "var(--accent)" }}>{statusLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {/* Previous track */}
            <button
              onClick={onSkipPrevious}
              className="transition-colors p-1"
              style={{ color: "var(--text-muted)" }}
              aria-label="Previous track"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Back 10s */}
            <button
              onClick={onSkipBackward}
              disabled={!isReady}
              className="transition-colors p-1 relative disabled:opacity-30"
              style={{ color: "var(--text-muted)" }}
              aria-label="Back 10 seconds"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-[1px]">
                10
              </span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlayPause}
              disabled={!isReady}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "white",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Forward 10s */}
            <button
              onClick={onSkipForward}
              disabled={!isReady}
              className="transition-colors p-1 relative disabled:opacity-30"
              style={{ color: "var(--text-muted)" }}
              aria-label="Forward 10 seconds"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-[1px]">
                10
              </span>
            </button>

            {/* Next track */}
            <button
              onClick={onSkipNext}
              className="transition-colors p-1"
              style={{ color: "var(--text-muted)" }}
              aria-label="Next track"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Replay */}
            <button
              onClick={onReplay}
              disabled={!isReady}
              className="transition-colors p-1 ml-1 disabled:opacity-30"
              style={{ color: "var(--text-muted)" }}
              aria-label="Replay"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>
          </div>
        </div>
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          disabled={!isReady}
        />
      </div>
    </div>
  );
}
