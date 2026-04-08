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
    // Filter out URLs that are already in the playlist
    const newUrls = urls.filter((url) => !existingUrls.includes(url));
    if (newUrls.length > 0) {
      onSubmit(newUrls);
      setInput(""); // Clear after submitting
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
        className="w-full h-32 p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono text-sm"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-zinc-500">
          {newUrls.length > 0
            ? `${newUrls.length} new link${newUrls.length > 1 ? "s" : ""}`
            : allUrls.length > 0 && duplicates > 0
              ? "Already in playlist"
              : "Paste URLs to add to playlist"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={newUrls.length === 0}
          className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Add to Playlist
        </button>
      </div>
    </div>
  );
}
