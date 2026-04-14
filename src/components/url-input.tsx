"use client";

import { useState } from "react";
import { parseUrls, isYouTubeUrl } from "@/lib/url-utils";
import { ReadMode } from "@/types";

interface UrlInputProps {
  onSubmit: (urls: string[], readMode: ReadMode) => void;
  existingUrls?: string[];
  defaultReadMode?: ReadMode;
}

export function UrlInput({ onSubmit, existingUrls = [], defaultReadMode = "summary" }: UrlInputProps) {
  const [input, setInput] = useState("");
  const [readMode, setReadMode] = useState<ReadMode>(defaultReadMode);

  const handleSubmit = () => {
    const urls = parseUrls(input);
    const newUrls = urls.filter((url) => !existingUrls.includes(url));
    if (newUrls.length > 0) {
      onSubmit(newUrls, readMode);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit();
    }
  };

  const allUrls = parseUrls(input);
  const newUrls = allUrls.filter((url) => !existingUrls.includes(url));
  const duplicates = allUrls.length - newUrls.length;
  const hasArticleUrls = newUrls.some((url) => !isYouTubeUrl(url));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"Paste one or more URLs, one per line...\n\nhttps://youtube.com/watch?v=...\nhttps://example.com/article"}
        className="w-full h-32 p-4 rounded-xl resize-none focus:outline-none focus:ring-1 font-mono text-sm transition-colors"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-secondary)",
          color: "var(--text-primary)",
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {newUrls.length > 0
              ? `${newUrls.length} new link${newUrls.length > 1 ? "s" : ""}`
              : allUrls.length > 0 && duplicates > 0
                ? "Already in playlist"
                : "Paste URLs to add to playlist"}
          </span>
          {hasArticleUrls && (
            <div
              className="flex items-center rounded-lg overflow-hidden text-xs font-medium"
              style={{ border: "1px solid var(--border-secondary)" }}
            >
              <button
                onClick={() => setReadMode("summary")}
                className="px-3 py-1.5 transition-colors"
                style={{
                  background: readMode === "summary" ? "var(--accent)" : "transparent",
                  color: readMode === "summary" ? "#fff" : "var(--text-muted)",
                }}
              >
                Briefing
              </button>
              <button
                onClick={() => setReadMode("full")}
                className="px-3 py-1.5 transition-colors"
                style={{
                  background: readMode === "full" ? "var(--accent)" : "transparent",
                  color: readMode === "full" ? "#fff" : "var(--text-muted)",
                }}
              >
                Full Read
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={newUrls.length === 0}
          className="px-5 py-2 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-40"
          style={{ background: newUrls.length > 0 ? "var(--accent)" : "var(--text-muted)" }}
        >
          Add to Playlist
        </button>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
        {readMode === "full" && hasArticleUrls
          ? "Full Read: articles will be read aloud in full (no summarization). YouTube links always use Briefing mode."
          : "Note: Paywalled articles (NYTimes, WSJ, etc.) and private YouTube videos cannot be extracted."}
      </p>
    </div>
  );
}
