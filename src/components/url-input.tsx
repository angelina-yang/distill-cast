"use client";

import { useState } from "react";
import { parseUrls } from "@/lib/url-utils";

interface UrlInputProps {
  onSubmit: (urls: string[]) => void;
  existingUrls?: string[];
}

export function UrlInput({ onSubmit, existingUrls = [] }: UrlInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const urls = parseUrls(input);
    const newUrls = urls.filter((url) => !existingUrls.includes(url));
    if (newUrls.length > 0) {
      onSubmit(newUrls);
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
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {newUrls.length > 0
            ? `${newUrls.length} new link${newUrls.length > 1 ? "s" : ""}`
            : allUrls.length > 0 && duplicates > 0
              ? "Already in playlist"
              : "Paste URLs to add to playlist"}
        </span>
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
        Note: Paywalled articles (NYTimes, WSJ, etc.) and private YouTube videos cannot be extracted.
      </p>
    </div>
  );
}
