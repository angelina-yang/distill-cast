"use client";

interface HeaderProps {
  onClearAll?: () => void;
  showClear: boolean;
  onOpenSettings: () => void;
  hasKeys: boolean;
  onTogglePlaylist?: () => void;
  playlistOpen?: boolean;
  onPlay?: () => void;
  showPlayButton?: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function Header({
  onClearAll,
  showClear,
  onOpenSettings,
  hasKeys,
  onTogglePlaylist,
  playlistOpen,
  onPlay,
  showPlayButton,
  isDark = true,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 md:py-4"
      style={{
        borderBottom: `1px solid var(--border-primary)`,
        background: `var(--bg-primary)`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Playlist toggle */}
        {onTogglePlaylist && showClear && (
          <button
            onClick={onTogglePlaylist}
            className="p-1.5 transition-colors"
            style={{ color: playlistOpen ? "var(--accent)" : "var(--text-muted)" }}
            aria-label={playlistOpen ? "Close playlist" : "Open playlist"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
        )}
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              TL;Listen
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
              Articles & videos → audio briefings
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Play button */}
        {showPlayButton && onPlay && (
          <button
            onClick={onPlay}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-full transition-colors animate-pulse"
            style={{ background: "var(--accent)" }}
            title="Your briefing is ready!"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="hidden sm:inline">Play</span>
          </button>
        )}
        {showClear && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-sm transition-colors hidden sm:block hover:text-red-400"
            style={{ color: "var(--text-muted)" }}
          >
            Clear All
          </button>
        )}
        {/* Theme toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}
        <a
          href="https://buymeacoffee.com/angelinayang"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm transition-colors hover:text-yellow-400"
          style={{ color: "var(--text-muted)" }}
          title="Buy me a coffee"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21h18v-2H2v2zM20 8h-2V5h2v3zm0-5H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-4 10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v8zm4-5h-2V5h2v3z" />
          </svg>
        </a>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            color: hasKeys ? "var(--text-muted)" : undefined,
          }}
          title="API Key Settings"
        >
          {!hasKeys ? (
            <span className="text-yellow-400 animate-pulse">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
