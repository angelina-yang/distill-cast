"use client";

import { useState, useCallback, useMemo } from "react";
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
import { useTheme } from "@/hooks/use-theme";

/** Split summary into sentences for highlighting during playback */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?\n]+[\s]*/g);
  if (!parts) return [text];
  const joined = parts.join("");
  if (joined.length < text.length) {
    parts.push(text.slice(joined.length));
  }
  return parts.filter((s) => s.trim().length > 0);
}

export default function Home() {
  const { isRegistered, loaded: userLoaded, register } = useUser();
  const { keys, hasKeys, loaded, saveKeys, clearKeys } = useApiKeys();
  const { items, isProcessing, addUrls, toggleDone, removeItem, clearAll } =
    useProcessing(keys);
  const { isDark, toggleTheme, loaded: themeLoaded } = useTheme();

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
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleRegistration = (name: string, email: string) => {
    register(name, email);
    if (!hasKeys) {
      setSettingsOpen(true);
    }
  };

  const hasItems = items.length > 0;
  const activeItems = items.filter((i) => !i.done);
  const hasReadyItems = activeItems.some((i) => i.status === "ready");
  const showPlayButton = hasReadyItems && !isPlaying && currentIndex < 0;

  const displayItem =
    currentIndex >= 0 && items[currentIndex] ? items[currentIndex] : null;

  const sentences = useMemo(() => {
    if (!displayItem?.summary) return [];
    return splitSentences(displayItem.summary);
  }, [displayItem?.summary]);

  const activeSentenceIndex = useMemo(() => {
    if (!isPlaying || !duration || sentences.length === 0) return -1;
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    const progress = currentTime / duration;
    let charsSoFar = 0;
    for (let i = 0; i < sentences.length; i++) {
      charsSoFar += sentences[i].length;
      if (charsSoFar / totalChars >= progress) return i;
    }
    return sentences.length - 1;
  }, [isPlaying, currentTime, duration, sentences]);

  if (!loaded || !userLoaded || !themeLoaded) return null;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <Header
        onClearAll={clearAll}
        showClear={hasItems}
        onOpenSettings={() => setSettingsOpen(true)}
        hasKeys={hasKeys}
        onTogglePlaylist={() => {
          if (window.innerWidth < 768) {
            setPlaylistOpen((prev) => !prev);
          } else {
            setSidebarVisible((prev) => !prev);
          }
        }}
        playlistOpen={playlistOpen || sidebarVisible}
        onPlay={togglePlayPause}
        showPlayButton={showPlayButton}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {!hasItems && !hasKeys ? (
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Your audio briefing</h2>
              <p className="max-w-md" style={{ color: "var(--text-muted)" }}>
                Paste article or YouTube links below. We&apos;ll distill them
                into a podcast-style audio briefing you can listen to on the go.
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-5 py-2.5 text-white font-medium rounded-lg transition-colors"
              style={{ background: "var(--accent)" }}
            >
              Set up API Keys to get started
            </button>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex min-h-0 pb-20">
          {hasItems && (
            <SidebarPlaylist
              items={items}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              onItemClick={playItem}
              onToggleDone={toggleDone}
              onRemoveItem={removeItem}
              mobileOpen={playlistOpen}
              onMobileClose={() => setPlaylistOpen(false)}
              desktopVisible={sidebarVisible}
            />
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {hasKeys && (
              <div className="max-w-2xl mx-auto mb-6">
                <UrlInput
                  onSubmit={addUrls}
                  existingUrls={items.map((i) => i.url)}
                />
              </div>
            )}

            {hasReadyItems && !isPlaying && currentIndex < 0 && (
              <div className="flex items-center justify-center mt-8">
                <button
                  onClick={togglePlayPause}
                  className="px-8 py-3 text-white font-medium rounded-full transition-colors text-lg"
                  style={{ background: "var(--accent)" }}
                >
                  Play Briefing
                </button>
              </div>
            )}

            {displayItem && displayItem.summary && (
              <div className="max-w-2xl mx-auto mt-4">
                <div className="mb-4">
                  <span
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    {currentIndex >= 0 && isPlaying
                      ? "Now Playing"
                      : finished
                        ? "Finished"
                        : "Paused"}
                  </span>
                  <h2 className="text-xl font-bold mt-1">
                    {displayItem.title}
                  </h2>
                  <p className="text-sm mt-1 break-all" style={{ color: "var(--text-muted)" }}>
                    {displayItem.type === "youtube" ? "YouTube" : "Article"} &mdash;{" "}
                    {displayItem.url}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 md:p-6"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <h3
                    className="text-sm font-semibold uppercase tracking-wider mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Summary
                  </h3>
                  <div
                    className="leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {isPlaying && sentences.length > 0
                      ? sentences.map((sentence, i) => (
                          <span
                            key={i}
                            className="transition-colors duration-300 rounded px-0.5"
                            style={{
                              ...(i === activeSentenceIndex
                                ? {
                                    background: "var(--highlight-bg)",
                                    color: "var(--highlight-text)",
                                    fontWeight: 500,
                                  }
                                : i < activeSentenceIndex
                                  ? { color: "var(--past-text)" }
                                  : { color: "var(--text-secondary)" }),
                            }}
                          >
                            {sentence}
                          </span>
                        ))
                      : displayItem.summary}
                  </div>
                </div>
              </div>
            )}

            {!hasItems && hasKeys && (
              <div className="text-center mt-8" style={{ color: "var(--text-muted)" }}>
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
