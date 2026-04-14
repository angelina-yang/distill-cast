"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { useDraftInstructions } from "@/hooks/use-draft-instructions";
import { DraftModal } from "@/components/draft-modal";

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
  const { items, isProcessing, addUrls, toggleDone, removeItem, reprocessItem, clearAll } =
    useProcessing(keys);
  const { isDark, toggleTheme, loaded: themeLoaded } = useTheme();
  const { instructions, setInstructions } = useDraftInstructions();
  const [draftPlatform, setDraftPlatform] = useState<"tweet" | "linkedin" | null>(null);

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
  const [importBanner, setImportBanner] = useState<{ count: number; source: string } | null>(null);
  const autoPlayOnReadyRef = useRef(false);

  const handleRegistration = (name: string, email: string) => {
    register(name, email);
    if (!hasKeys) {
      setSettingsOpen(true);
    }
  };

  // Accept ?urls=... query param from other Lab tools (e.g., Daily Brew)
  // Auto-add URLs to the playlist when keys are ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasKeys || !loaded || !userLoaded) return;

    const params = new URLSearchParams(window.location.search);
    const urlsParam = params.get("urls");
    if (!urlsParam) return;

    // Validate each URL: must parse, must use http/https, max 50 URLs
    const urlList = urlsParam
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && u.length < 2048)
      .filter((u) => {
        try {
          const parsed = new URL(u);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      })
      .slice(0, 50);

    if (urlList.length > 0) {
      const modeParam = params.get("mode");
      const readMode = modeParam === "full" ? "full" as const : "summary" as const;
      addUrls(urlList, readMode);

      // Show a banner acknowledging where these URLs came from
      const sourceParam = (params.get("source") || "").trim().toLowerCase();
      const knownSources: Record<string, string> = {
        "morning-brew": "Morning Brew",
        "daily-brew": "Daily Brew",
        "social-claw": "Social Claw",
        "twosetai": "TwoSetAI",
      };
      const sourceLabel = knownSources[sourceParam] || "another Lab tool";
      setImportBanner({ count: urlList.length, source: sourceLabel });
      autoPlayOnReadyRef.current = true;

      // Clean up URL so we don't re-add on refresh
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKeys, loaded, userLoaded]);

  // Auto-play when the first item becomes ready after URL import
  useEffect(() => {
    if (!autoPlayOnReadyRef.current) return;
    const firstReady = items.find((i) => i.status === "ready");
    if (firstReady && !isPlaying && currentIndex < 0) {
      const idx = items.indexOf(firstReady);
      playItem(idx);
      autoPlayOnReadyRef.current = false;
    }
  }, [items, isPlaying, currentIndex, playItem]);

  const hasItems = items.length > 0;
  const activeItems = items.filter((i) => !i.done);
  const hasReadyItems = activeItems.some((i) => i.status === "ready");
  const showPlayButton = hasReadyItems && !isPlaying && currentIndex < 0;

  const displayItem =
    currentIndex >= 0 && items[currentIndex] ? items[currentIndex] : null;

  const displayText = displayItem?.summary || "";
  const sentences = useMemo(() => {
    if (!displayText) return [];
    return splitSentences(displayText);
  }, [displayText]);

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
            {importBanner && (
              <div className="max-w-2xl mx-auto mb-4">
                <div
                  className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--accent)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📥</span>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      Added <strong>{importBanner.count}</strong>{" "}
                      {importBanner.count === 1 ? "article" : "articles"} from{" "}
                      <strong>{importBanner.source}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setImportBanner(null)}
                    className="transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Dismiss"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {hasKeys && (
              <div className="max-w-2xl mx-auto mb-6">
                <UrlInput
                  onSubmit={addUrls}
                  existingUrls={items.map((i) => i.url)}
                  defaultReadMode="summary"
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
                  {displayItem.type === "article" ? (
                    <button
                      onClick={() =>
                        reprocessItem(
                          displayItem.id,
                          displayItem.readMode === "full" ? "summary" : "full"
                        )
                      }
                      disabled={displayItem.status !== "ready" && displayItem.status !== "error"}
                      className="inline-flex items-center gap-1.5 mt-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: displayItem.readMode === "full" ? "var(--accent)" : "var(--bg-card)",
                        color: displayItem.readMode === "full" ? "#fff" : "var(--text-muted)",
                        border: displayItem.readMode === "full" ? "none" : "1px solid var(--border-primary)",
                      }}
                      title={`Switch to ${displayItem.readMode === "full" ? "summary" : "full read"}`}
                    >
                      {displayItem.readMode === "full" ? "Full Read" : "Summary"}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  ) : (
                    <span
                      className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-primary)",
                      }}
                    >
                      Summary
                    </span>
                  )}
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
                    {displayItem.readMode === "full" ? "Full Read" : "Briefing"}
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

                {/* Share / Draft buttons */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    Draft a post:
                  </span>
                  <button
                    onClick={() => setDraftPlatform("tweet")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-secondary)",
                    }}
                    title="Draft a tweet"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Tweet
                  </button>
                  <button
                    onClick={() => setDraftPlatform("linkedin")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-secondary)",
                    }}
                    title="Draft a LinkedIn post"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </button>
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

      {displayItem?.summary && (
        <DraftModal
          isOpen={draftPlatform !== null}
          platform={draftPlatform || "tweet"}
          onClose={() => setDraftPlatform(null)}
          summary={displayItem.summary}
          title={displayItem.title}
          claudeApiKey={keys.vipMode ? undefined : keys.claudeApiKey || undefined}
          instructions={draftPlatform === "linkedin" ? instructions.linkedin : instructions.tweet}
          onInstructionsChange={(value) =>
            setInstructions(
              draftPlatform === "linkedin"
                ? { linkedin: value }
                : { tweet: value }
            )
          }
        />
      )}
    </div>
  );
}
