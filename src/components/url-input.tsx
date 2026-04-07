"use client";

import { useState } from "react";
import { parseUrls } from "@/lib/url-utils";

interface UrlInputProps {
  onSubmit: (urls: string[]) => void;
  disabled: boolean;
}

export function UrlInput({ onSubmit, disabled }: UrlInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const urls = parseUrls(input);
    if (urls.length > 0) {
      onSubmit(urls);
    }
  };

  const urlCount = parseUrls(input).length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"Paste one or more URLs, one per line...\n\nhttps://youtube.com/watch?v=...\nhttps://example.com/article"}
        className="w-full h-40 p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono text-sm"
        disabled={disabled}
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-zinc-500">
          {urlCount > 0
            ? `${urlCount} link${urlCount > 1 ? "s" : ""} detected`
            : "Paste URLs to get started"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={disabled || urlCount === 0}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
        >
          {disabled ? "Processing..." : "Generate Briefing"}
        </button>
      </div>
    </div>
  );
}
