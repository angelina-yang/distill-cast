"use client";

import { useState } from "react";

interface WelcomeModalProps {
  isOpen: boolean;
  onComplete: (name: string, email: string) => void;
}

export function WelcomeModal({ isOpen, onComplete }: WelcomeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const canSubmit =
    name.trim() && email.trim() && email.includes("@") && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          newsletter,
        }),
      });
    } catch {
      // Don't block registration if Substack fails
    }
    setSubmitting(false);
    onComplete(name.trim(), email.trim());
  };

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border-secondary)",
    color: "var(--text-primary)",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "var(--bg-backdrop)" }} />
      <div
        className="relative rounded-2xl w-full max-w-md mx-4 p-6"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <div className="text-center mb-6">
          {/* Logo */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Welcome to TL;Listen
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Turn articles and YouTube videos into audio briefings you can listen
            to on the go.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={inputStyle}
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded"
              style={{ accentColor: "var(--accent)" }}
            />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Subscribe to the{" "}
              <a
                href="https://angelinayang.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                TwoSetAI newsletter
              </a>{" "}
              -- new free AI tools, founder insights, and early access to what
              I&apos;m building
            </p>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
            Your API keys are stored locally in your browser. When you generate
            a briefing, your keys are sent to our server to make API calls on
            your behalf -- they pass through our server but are never stored,
            logged, or shared.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 text-white font-medium rounded-lg transition-colors mt-2 disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {submitting ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
