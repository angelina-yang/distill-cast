"use client";

import { useState, useEffect } from "react";
import { ApiKeys, LANGUAGES, OutputLanguage } from "@/hooks/use-api-keys";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
  onClear: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  keys,
  onSave,
  onClear,
}: SettingsModalProps) {
  const [form, setForm] = useState<ApiKeys>(keys);
  const [vipPassword, setVipPassword] = useState("");
  const [vipError, setVipError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setForm(keys);
    setVipPassword("");
    setVipError("");
    setSaveError("");
  }, [keys, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    // If already VIP or keys already validated, just save
    if (form.vipMode || form.keysValidated) {
      onSave(form);
      setSaving(false);
      onClose();
      return;
    }

    // Validate keys before saving
    if (!form.claudeApiKey || !form.elevenLabsApiKey) {
      setSaveError("Please enter both API keys to continue.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/validate-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claudeApiKey: form.claudeApiKey,
          elevenLabsApiKey: form.elevenLabsApiKey,
        }),
      });
      const data = await res.json();

      if (data.claude && data.elevenLabs) {
        onSave({ ...form, keysValidated: true });
        setSaving(false);
        onClose();
      } else {
        const errors: string[] = [];
        if (!data.claude) errors.push("Anthropic key is invalid");
        if (!data.elevenLabs) errors.push("ElevenLabs key is invalid");
        setSaveError(errors.join(". ") + ". Please check and try again.");
        setSaving(false);
      }
    } catch {
      setSaveError("Could not validate keys. Please try again.");
      setSaving(false);
    }
  };

  const handleVipCheck = async () => {
    if (!vipPassword.trim()) return;
    setSaving(true);
    setVipError("");
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: vipPassword.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        onSave({ ...form, vipMode: true, keysValidated: true });
        onClose();
      } else {
        setVipError("Invalid password");
      }
    } catch {
      setVipError("Verification failed");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. Language — top priority, user-friendly */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              What language do you want your briefings in?
            </label>
            <select
              value={form.outputLanguage}
              onChange={(e) =>
                setForm({ ...form, outputLanguage: e.target.value as OutputLanguage })
              }
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Content in any language will be summarized and read aloud in your chosen language.
            </p>
          </div>

          {/* 2. API Keys section */}
          {!form.vipMode && (
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-medium text-white">Your API Keys</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  TL;Listen uses AI to summarize and generate audio. You&apos;ll need
                  two free API keys to get started — takes about 2 minutes.
                </p>
              </div>

              <div className="space-y-4">
                {/* Anthropic key */}
                <div>
                  <label className="block text-sm text-zinc-300 mb-1.5">
                    Anthropic API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.claudeApiKey}
                    onChange={(e) =>
                      setForm({ ...form, claudeApiKey: e.target.value, keysValidated: false })
                    }
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Powers the AI summarization.{" "}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Get your key here
                    </a>
                  </p>
                </div>

                {/* ElevenLabs key */}
                <div>
                  <label className="block text-sm text-zinc-300 mb-1.5">
                    ElevenLabs API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.elevenLabsApiKey}
                    onChange={(e) =>
                      setForm({ ...form, elevenLabsApiKey: e.target.value, keysValidated: false })
                    }
                    placeholder="sk_..."
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Powers the voice audio.{" "}
                    <a
                      href="https://elevenlabs.io/app/settings/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Get your key here
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {form.vipMode && (
            <div className="bg-green-950/30 rounded-lg p-3 border border-green-800/30">
              <p className="text-xs text-green-400">
                VIP access active — using built-in API keys.
              </p>
            </div>
          )}

          {/* 3. Voice ID — optional */}
          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">
              Voice <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.elevenLabsVoiceId}
              onChange={(e) =>
                setForm({ ...form, elevenLabsVoiceId: e.target.value })
              }
              placeholder="Leave empty for defaults (Adam / Rachel)"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Default: Adam (English), Rachel (other languages). Browse at{" "}
              <a
                href="https://elevenlabs.io/app/voice-library"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                elevenlabs.io/voice-library
              </a>
            </p>
          </div>

          {/* Privacy note */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your API keys are stored locally in your browser. When you generate
              a briefing, your keys are sent to our server to make API calls on
              your behalf — they pass through our server but are never stored,
              logged, or shared.
            </p>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="bg-red-950/30 rounded-lg p-3 border border-red-800/30">
              <p className="text-xs text-red-400">{saveError}</p>
            </div>
          )}

          {/* 4. VIP password — at the bottom */}
          {!form.vipMode && (
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-sm text-zinc-400 mb-1.5">
                Have a VIP password?
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={vipPassword}
                  onChange={(e) => setVipPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500"
                  onKeyDown={(e) => e.key === "Enter" && handleVipCheck()}
                />
                <button
                  onClick={handleVipCheck}
                  disabled={!vipPassword.trim() || saving}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-white text-sm rounded-lg transition-colors border border-zinc-700"
                >
                  {saving ? "..." : "Go"}
                </button>
              </div>
              {vipError && (
                <p className="mt-1 text-xs text-red-400">{vipError}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={() => {
              onClear();
              setSaveError("");
            }}
            className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Validating..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
