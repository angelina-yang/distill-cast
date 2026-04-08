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
      // Always register (logs to Google Sheet), Substack only if opted in
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md mx-4 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to TL;Listen
          </h2>
          <p className="text-zinc-400 text-sm">
            Turn articles and YouTube videos into audio briefings you can listen
            to on the go.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Newsletter opt-in — separate, optional, unchecked by default */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
            />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Subscribe to the{" "}
              <a
                href="https://angelinayang.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                TwoSetAI newsletter
              </a>{" "}
              — new free AI tools, founder insights, and early access to what
              I&apos;m building
            </p>
          </div>

          {/* Privacy disclosure — not a checkbox, just info */}
          <p className="text-xs text-zinc-500 leading-relaxed">
            Your API keys are stored locally in your browser. When you generate
            a briefing, your keys are sent to our server to make API calls on
            your behalf — they pass through our server but are never stored,
            logged, or shared.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors mt-2"
          >
            {submitting ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
