"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { UrlInput } from "@/components/url-input";
import { SidebarPlaylist } from "@/components/sidebar-playlist";
import { AudioPlayer } from "@/components/player/audio-player";
import { SettingsModal } from "@/components/settings-modal";
import { WelcomeModal } from "@/components/welcome-modal";
import { useProcessing } from "@/hooks/use-processing";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useUser } from "@/hooks/use-user";

export default function Home() {
  const { isRegistered, loaded: userLoaded, register } = useUser();
  const { keys, hasKeys, loaded, saveKeys, clearKeys } = useApiKeys();
  const { items, isProcessing, addUrls, toggleDone, removeItem, clearAll } =
    useProcessing(keys);

  // Mark item as done when audio finishes playing
  const handleItemFinished = useCallback(
    (itemId: string) => {
      toggleDone(itemId);
    },
    [toggleDone]
  );

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
    skipForward,
    skipBackward,
    replay,
    playItem,
    seek,
  } = useAudioPlayer(items, { onItemFinished: handleItemFinished });

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRegistration = (name: string, email: string) => {
    register(name, email);
    if (!hasKeys) {
      setSettingsOpen(true);
    }
  };

  const hasItems = items.length > 0;
  const activeItems = items.filter((i) => !i.done);
  const hasReadyItems = activeItems.some((i) => i.status === "ready");

  const displayItem =
    currentIndex >= 0 && items[currentIndex] ? items[currentIndex] : null;

  if (!loaded || !userLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header
        onClearAll={clearAll}
        showClear={hasItems}
        onOpenSettings={() => setSettingsOpen(true)}
        hasKeys={hasKeys}
      />

      {!hasItems && !hasKeys ? (
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Your audio briefing</h2>
              <p className="text-zinc-400 max-w-md">
                Paste article or YouTube links below. We&apos;ll distill them
                into a podcast-style audio briefing you can listen to on the go.
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
            >
              Set up API Keys to get started
            </button>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex min-h-0 pb-20">
          {/* Sidebar */}
          {hasItems && (
            <SidebarPlaylist
              items={items}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              onItemClick={playItem}
              onToggleDone={toggleDone}
              onRemoveItem={removeItem}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* URL input — always visible when keys are set */}
            {hasKeys && (
              <div className="max-w-2xl mx-auto mb-6">
                <UrlInput
                  onSubmit={addUrls}
                  existingUrls={items.map((i) => i.url)}
                />
              </div>
            )}

            {/* Play button */}
            {hasReadyItems && !isPlaying && currentIndex < 0 && (
              <div className="flex items-center justify-center mt-8">
                <button
                  onClick={togglePlayPause}
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-colors text-lg"
                >
                  Play Briefing
                </button>
              </div>
            )}

            {/* Now playing summary */}
            {displayItem && displayItem.summary && (
              <div className="max-w-2xl mx-auto mt-4">
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
                    {displayItem.type === "youtube" ? "YouTube" : "Article"} —{" "}
                    {displayItem.url}
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

            {/* Empty state */}
            {!hasItems && hasKeys && (
              <div className="text-center mt-8 text-zinc-500">
                <p>Paste a link above to get started</p>
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
        onSkipForward={skipForward}
        onSkipBackward={skipBackward}
        onReplay={replay}
        onSeek={seek}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keys={keys}
        onSave={saveKeys}
        onClear={clearKeys}
      />

      <WelcomeModal
        isOpen={!isRegistered}
        onComplete={handleRegistration}
      />
    </div>
  );
}
