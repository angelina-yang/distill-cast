"use client";

import { useState, useEffect } from "react";
import { ApiKeys } from "@/hooks/use-api-keys";

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

  useEffect(() => {
    setForm(keys);
  }, [keys, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg mx-4 p-6">
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

        <div className="space-y-5">
          {/* Claude API Key */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={form.claudeApiKey}
              onChange={(e) =>
                setForm({ ...form, claudeApiKey: e.target.value })
              }
              placeholder="sk-ant-..."
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Get yours at{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* ElevenLabs API Key */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              ElevenLabs API Key
            </label>
            <input
              type="password"
              value={form.elevenLabsApiKey}
              onChange={(e) =>
                setForm({ ...form, elevenLabsApiKey: e.target.value })
              }
              placeholder="sk_..."
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Get yours at{" "}
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                elevenlabs.io
              </a>
            </p>
          </div>

          {/* Voice ID */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              ElevenLabs Voice ID
            </label>
            <input
              type="text"
              value={form.elevenLabsVoiceId}
              onChange={(e) =>
                setForm({ ...form, elevenLabsVoiceId: e.target.value })
              }
              placeholder="Voice ID"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Default: Adam. Browse voices at{" "}
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
              Your API keys are stored locally in your browser and only sent to
              our server to make API calls on your behalf. We never store or log
              your keys.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={onClear}
            className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear all keys
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
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
