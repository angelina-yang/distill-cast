"use client";

import { Header } from "@/components/header";
import { UrlInput } from "@/components/url-input";
import { SidebarPlaylist } from "@/components/sidebar-playlist";
import { AudioPlayer } from "@/components/player/audio-player";
import { useProcessing } from "@/hooks/use-processing";
import { useAudioPlayer } from "@/hooks/use-audio-player";

export default function Home() {
  const { items, isProcessing, submitUrls, clearAll } = useProcessing();
  const {
    currentIndex,
    currentItem,
    isPlaying,
    playingIntro,
    currentTime,
    duration,
    finished,
    togglePlayPause,
    skipNext,
    skipPrevious,
    playItem,
    seek,
  } = useAudioPlayer(items);

  const hasItems = items.length > 0;
  const hasReadyItems = items.some((i) => i.status === "ready");

  // Currently playing or finished item to show summary
  const displayItem =
    currentIndex >= 0 && items[currentIndex] ? items[currentIndex] : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header onClear={clearAll} showClear={hasItems} />

      {!hasItems ? (
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Your audio briefing</h2>
              <p className="text-zinc-400 max-w-md">
                Paste article or YouTube links below. We&apos;ll distill them
                into a podcast-style audio briefing you can listen to on the go.
              </p>
            </div>
            <UrlInput onSubmit={submitUrls} disabled={false} />
          </div>
        </main>
      ) : (
        <div className="flex-1 flex min-h-0 pb-20">
          {/* Sidebar playlist */}
          <SidebarPlaylist
            items={items}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            onItemClick={playItem}
          />

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* URL input at top when processing */}
            {isProcessing && (
              <div className="mb-6">
                <UrlInput onSubmit={submitUrls} disabled={true} />
              </div>
            )}

            {/* Play button before first play */}
            {hasReadyItems && !isPlaying && currentIndex < 0 && (
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={togglePlayPause}
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-colors text-lg"
                >
                  Play Briefing
                </button>
              </div>
            )}

            {/* Now playing: show summary text */}
            {displayItem && displayItem.summary && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                  <span className="text-xs text-violet-400 uppercase tracking-wider font-medium">
                    {currentIndex >= 0 && isPlaying
                      ? "Now Playing"
                      : finished
                        ? "Finished"
                        : "Paused"}
                  </span>
                  <h2 className="text-xl font-bold mt-1">
                    {displayItem.title}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {displayItem.type === "youtube" ? "YouTube" : "Article"} — {displayItem.url}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Summary
                  </h3>
                  <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {displayItem.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Empty state when items exist but nothing selected */}
            {!displayItem && !isProcessing && hasItems && !hasReadyItems && (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Processing your links...
              </div>
            )}
          </main>
        </div>
      )}

      <AudioPlayer
        currentItem={currentItem}
        isPlaying={isPlaying}
        playingIntro={playingIntro}
        currentTime={currentTime}
        duration={duration}
        onTogglePlayPause={togglePlayPause}
        onSkipNext={skipNext}
        onSkipPrevious={skipPrevious}
        onSeek={seek}
      />
    </div>
  );
}
