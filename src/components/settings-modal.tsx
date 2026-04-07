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
  const [vipChecking, setVipChecking] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    claude?: boolean;
    elevenLabs?: boolean;
    errors?: Record<string, string>;
  }>({});

  useEffect(() => {
    setForm(keys);
    setValidation({});
    setVipPassword("");
    setVipError("");
  }, [keys, isOpen]);

  if (!isOpen) return null;

  const handleVipCheck = async () => {
    if (!vipPassword.trim()) return;
    setVipChecking(true);
    setVipError("");
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: vipPassword.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        const updated = { ...form, vipMode: true, keysValidated: true };
        onSave(updated);
        onClose();
      } else {
        setVipError("Invalid password");
      }
    } catch {
      setVipError("Verification failed");
    }
    setVipChecking(false);
  };

  const handleValidateKeys = async () => {
    if (!form.claudeApiKey || !form.elevenLabsApiKey) return;
    setValidating(true);
    setValidation({});
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
      setValidation(data);
      if (data.claude && data.elevenLabs) {
        const updated = { ...form, keysValidated: true };
        setForm(updated);
      }
    } catch {
      setValidation({ errors: { general: "Validation failed" } });
    }
    setValidating(false);
  };

  const handleSave = () => {
    if (!form.keysValidated && !form.vipMode) return;
    onSave(form);
    onClose();
  };

  const canSave = form.vipMode || form.keysValidated;
  const bothKeysEntered = Boolean(form.claudeApiKey && form.elevenLabsApiKey);

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

        <div className="space-y-5">
          {/* VIP Password */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              VIP Password
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Have a VIP password? Enter it to skip API key setup.
            </p>
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
                disabled={!vipPassword.trim() || vipChecking}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {vipChecking ? "..." : "Verify"}
              </button>
            </div>
            {vipError && (
              <p className="mt-2 text-xs text-red-400">{vipError}</p>
            )}
            {form.vipMode && (
              <p className="mt-2 text-xs text-green-400">VIP access active</p>
            )}
          </div>

          {!form.vipMode && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-500">or use your own API keys</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Claude API Key */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
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
                  Required. Get yours at{" "}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300"
                  >
                    console.anthropic.com
                  </a>
                </p>
                {validation.claude === true && (
                  <p className="mt-1 text-xs text-green-400">Anthropic key verified</p>
                )}
                {validation.errors?.claude && (
                  <p className="mt-1 text-xs text-red-400">{validation.errors.claude}</p>
                )}
              </div>

              {/* ElevenLabs API Key */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
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
                  Required. Get yours at{" "}
                  <a
                    href="https://elevenlabs.io/app/settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300"
                  >
                    elevenlabs.io
                  </a>
                </p>
                {validation.elevenLabs === true && (
                  <p className="mt-1 text-xs text-green-400">ElevenLabs key verified</p>
                )}
                {validation.errors?.elevenLabs && (
                  <p className="mt-1 text-xs text-red-400">{validation.errors.elevenLabs}</p>
                )}
              </div>

              {/* Validate button */}
              <button
                onClick={handleValidateKeys}
                disabled={!bothKeysEntered || validating}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700"
              >
                {validating
                  ? "Validating keys..."
                  : form.keysValidated
                    ? "Keys validated"
                    : "Validate API Keys"}
              </button>
            </>
          )}

          {/* Voice ID — optional */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              ElevenLabs Voice ID <span className="text-zinc-500 font-normal">(optional)</span>
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

          {/* Output Language */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Output Language
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
              Summaries will be generated in this language regardless of input language.
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
            onClick={() => {
              onClear();
              setValidation({});
            }}
            className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear all
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
              disabled={!canSave}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
