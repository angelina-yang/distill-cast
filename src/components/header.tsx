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
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 md:py-4 border-b border-zinc-900">
      <div className="flex items-center gap-3">
        {/* Playlist toggle — always visible when there are items */}
        {onTogglePlaylist && showClear && (
          <button
            onClick={onTogglePlaylist}
            className={`p-1.5 transition-colors ${
              playlistOpen ? "text-violet-400" : "text-zinc-500 hover:text-white"
            }`}
            aria-label={playlistOpen ? "Close playlist" : "Open playlist"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">TL;Listen</h1>
          <p className="text-sm text-zinc-500 hidden sm:block">
            Turn articles and videos into audio briefings
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Play button — shows when audio is ready */}
        {showPlayButton && onPlay && (
          <button
            onClick={onPlay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-full transition-colors animate-pulse"
            title="Your briefing is ready — hit play!"
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
            className="text-sm text-zinc-500 hover:text-red-400 transition-colors hidden sm:block"
          >
            Clear All
          </button>
        )}
        <a
          href="https://buymeacoffee.com/angelinayang"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-yellow-400 transition-colors"
          title="Buy me a coffee"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21h18v-2H2v2zM20 8h-2V5h2v3zm0-5H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-4 10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v8zm4-5h-2V5h2v3z" />
          </svg>
        </a>
        <button
          onClick={onOpenSettings}
          className={`p-1.5 rounded-lg transition-colors ${
            hasKeys
              ? "text-zinc-500 hover:text-white"
              : "text-yellow-400 hover:text-yellow-300 animate-pulse"
          }`}
          title="API Key Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </header>
  );
}
