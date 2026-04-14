"use client";

import { useState } from "react";
import { PlaylistItem } from "@/types";

interface SidebarPlaylistProps {
  items: PlaylistItem[];
  currentIndex: number;
  selectedIndex?: number;
  isPlaying: boolean;
  onItemClick: (index: number) => void;
  onToggleDone: (id: string) => void;
  onRemoveItem: (id: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  desktopVisible?: boolean;
}

export function SidebarPlaylist({
  items,
  currentIndex,
  selectedIndex = -1,
  isPlaying,
  onItemClick,
  onToggleDone,
  onRemoveItem,
  mobileOpen,
  onMobileClose,
  desktopVisible = true,
}: SidebarPlaylistProps) {
  const [showDone, setShowDone] = useState(false);

  if (items.length === 0) return null;

  const activeItems = items.filter((i) => !i.done);
  const doneItems = items.filter((i) => i.done);

  const sidebarContent = (
    <>
      {/* Sidebar header with gradient accent */}
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "var(--accent-surface)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Playlist
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {activeItems.filter((i) => i.status === "ready").length} ready
              {doneItems.length > 0 && ` \u00B7 ${doneItems.length} done`}
            </p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label="Close playlist"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {activeItems.map((item, listIdx) => {
          const globalIndex = items.indexOf(item);
          const isCurrent = globalIndex === currentIndex;
          const isSelected = globalIndex === selectedIndex && !isCurrent;
          const isReady = item.status === "ready";
          const isClickable = isReady || (item.status === "error" && !!item.summary);
          const isSpinning =
            item.status === "extracting" ||
            item.status === "summarizing" ||
            item.status === "generating-audio";

          return (
            <div
              key={item.id}
              className="group relative transition-colors"
              style={{
                borderBottom: "1px solid color-mix(in srgb, var(--border-primary) 50%, transparent)",
                background: isCurrent ? "var(--bg-active)" : isSelected ? "var(--bg-hover)" : undefined,
                borderLeft: (isCurrent || isSelected) ? "3px solid var(--accent)" : "3px solid transparent",
                opacity: isClickable || isCurrent ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (!isCurrent && isClickable) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) e.currentTarget.style.background = "";
              }}
            >
              <button
                onClick={() => {
                  if (isClickable) {
                    onItemClick(globalIndex);
                    onMobileClose();
                  }
                }}
                disabled={!isClickable}
                className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer disabled:cursor-default"
              >
                {/* Status icon */}
                <div className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-4">
                      <div className="w-1 rounded-full animate-eq-1" style={{ background: "var(--accent)", height: "60%" }} />
                      <div className="w-1 rounded-full animate-eq-2" style={{ background: "var(--accent)", height: "100%" }} />
                      <div className="w-1 rounded-full animate-eq-3" style={{ background: "var(--accent)", height: "40%" }} />
                    </div>
                  ) : isSpinning ? (
                    <div
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{
                        borderColor: "var(--text-faint)",
                        borderTopColor: "var(--accent)",
                      }}
                    />
                  ) : item.status === "error" ? (
                    <span className="text-red-400 text-xs font-bold">!</span>
                  ) : (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        background: "var(--accent-surface)",
                        color: "var(--accent)",
                      }}
                    >
                      {listIdx + 1}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${isCurrent ? "font-medium" : ""}`}
                    style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-secondary)" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-faint)" }}>
                    {item.type === "youtube" ? "YouTube" : "Article"}
                    {item.status === "error" && (
                      <span className="text-red-400 ml-1">- Failed</span>
                    )}
                    {isSpinning && (
                      <span style={{ color: "var(--accent)" }} className="ml-1">
                        - {item.status === "extracting"
                          ? "Extracting"
                          : item.status === "summarizing"
                            ? (item.readMode === "full" ? "Preparing" : "Summarizing")
                            : "Generating audio"}
                      </span>
                    )}
                  </p>
                </div>
              </button>

              {/* Action buttons */}
              {isReady && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex md:hidden md:group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleDone(item.id); }}
                    className="p-1.5 transition-colors hover:text-green-400 active:text-green-400"
                    style={{ color: "var(--text-muted)" }}
                    title="Mark as done"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                    className="p-1.5 transition-colors hover:text-red-400 active:text-red-400"
                    style={{ color: "var(--text-muted)" }}
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
              className="w-full px-4 py-2 flex items-center justify-between text-xs"
              style={{
                color: "var(--text-muted)",
                borderBottom: "1px solid color-mix(in srgb, var(--border-primary) 50%, transparent)",
                background: "var(--bg-surface)",
              }}
            >
              <span>Done ({doneItems.length})</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
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
                    className="group relative opacity-50 hover:opacity-75 transition-opacity"
                    style={{ borderBottom: "1px solid color-mix(in srgb, var(--border-primary) 50%, transparent)" }}
                  >
                    <button
                      onClick={() => {
                        onItemClick(globalIndex);
                        onMobileClose();
                      }}
                      className="w-full text-left px-4 py-2 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="text-sm truncate line-through" style={{ color: "var(--text-muted)" }}>
                        {item.title}
                      </p>
                    </button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex md:hidden md:group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleDone(item.id); }}
                        className="p-1.5 transition-colors hover:text-yellow-400 active:text-yellow-400"
                        style={{ color: "var(--text-muted)" }}
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {desktopVisible && (
        <div
          className="hidden md:flex w-80 shrink-0 flex-col h-full"
          style={{
            background: "linear-gradient(180deg, var(--bg-sidebar-gradient-start), var(--bg-sidebar-gradient-end))",
            borderRight: "1px solid var(--border-primary)",
          }}
        >
          {sidebarContent}
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-backdrop)" }}
            onClick={onMobileClose}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] flex flex-col animate-slide-in"
            style={{
              background: "linear-gradient(180deg, var(--bg-sidebar-gradient-start), var(--bg-sidebar-gradient-end))",
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
