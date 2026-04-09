"use client";

import { useState, useEffect } from "react";

type Platform = "tweet" | "linkedin";

interface DraftModalProps {
  isOpen: boolean;
  platform: Platform;
  onClose: () => void;
  summary: string;
  title: string;
  claudeApiKey?: string;
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export function DraftModal({
  isOpen,
  platform,
  onClose,
  summary,
  title,
  claudeApiKey,
  instructions,
  onInstructionsChange,
}: DraftModalProps) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(instructions);

  useEffect(() => {
    setLocalInstructions(instructions);
  }, [instructions]);

  useEffect(() => {
    if (isOpen && summary) {
      generateDraft();
    }
    // Reset state when modal opens
    if (isOpen) {
      setDraft("");
      setError("");
      setCopied(false);
      setShowInstructions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generateDraft = async () => {
    setLoading(true);
    setError("");
    setDraft("");
    setCopied(false);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (claudeApiKey) {
        headers["x-claude-api-key"] = claudeApiKey;
      }

      const res = await fetch("/api/draft-post", {
        method: "POST",
        headers,
        body: JSON.stringify({
          platform,
          summary,
          title,
          instructions: localInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate draft");
      setDraft(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = draft;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveInstructions = () => {
    onInstructionsChange(localInstructions);
    setShowInstructions(false);
  };

  const handleRegenerate = () => {
    // Save instructions first if changed
    if (localInstructions !== instructions) {
      onInstructionsChange(localInstructions);
    }
    generateDraft();
  };

  if (!isOpen) return null;

  const platformLabel = platform === "tweet" ? "Tweet" : "LinkedIn Post";
  const charCount = draft.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "var(--bg-backdrop)" }}
        onClick={onClose}
      />
      <div
        className="relative rounded-2xl w-full max-w-lg mx-4 p-5 max-h-[85vh] overflow-y-auto"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {platform === "tweet" ? (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-surface)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-surface)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
            )}
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Draft {platformLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "var(--accent)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showInstructions ? (
                <path d="M6 9l6 6 6-6" />
              ) : (
                <path d="M9 18l6-6-6-6" />
              )}
            </svg>
            {instructions.trim()
              ? "Edit your style instructions"
              : "Add style instructions (optional)"}
          </button>

          {showInstructions && (
            <div className="mt-2 space-y-2">
              <textarea
                value={localInstructions}
                onChange={(e) => setLocalInstructions(e.target.value)}
                placeholder={
                  platform === "tweet"
                    ? 'e.g., "Casual tone, use 1 hashtag, include a hot take"'
                    : 'e.g., "Professional but warm, end with a question, mention my company TwoSetAI"'
                }
                className="w-full h-20 p-3 rounded-lg resize-none text-sm focus:outline-none focus:ring-1"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  These instructions persist across sessions
                </p>
                <button
                  onClick={handleSaveInstructions}
                  className="text-xs px-3 py-1 rounded-md transition-colors"
                  style={{
                    background: "var(--accent-surface)",
                    color: "var(--accent)",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {!showInstructions && instructions.trim() && (
            <p className="text-xs mt-1 truncate" style={{ color: "var(--text-faint)" }}>
              Using: &ldquo;{instructions.trim()}&rdquo;
            </p>
          )}
        </div>

        {/* Draft content */}
        <div
          className="rounded-lg p-4 min-h-[120px]"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-primary)",
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--text-faint)",
                  borderTopColor: "var(--accent)",
                }}
              />
              <span className="text-sm">Drafting your {platformLabel.toLowerCase()}...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : draft ? (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-primary)" }}
            >
              {draft}
            </p>
          ) : null}
        </div>

        {/* Character count for tweets */}
        {draft && platform === "tweet" && (
          <p
            className="text-xs mt-1.5 text-right"
            style={{ color: charCount > 280 ? "#ef4444" : "var(--text-faint)" }}
          >
            {charCount}/280 characters
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40"
            style={{ color: "var(--text-muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Regenerate
          </button>
          <button
            onClick={handleCopy}
            disabled={!draft || loading}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
