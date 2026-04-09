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

    if (form.vipMode || form.keysValidated) {
      onSave(form);
      setSaving(false);
      onClose();
      return;
    }

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
        if (!data.claude) errors.push(data.errors?.claude || "Anthropic key is invalid");
        if (!data.elevenLabs) errors.push(data.errors?.elevenLabs || "ElevenLabs key is invalid");
        setSaveError(errors.join("\n\n"));
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

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border-secondary)",
    color: "var(--text-primary)",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "var(--bg-backdrop)" }}
        onClick={onClose}
      />
      <div
        className="relative rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Settings</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              What language do you want your briefings in?
            </label>
            <select
              value={form.outputLanguage}
              onChange={(e) =>
                setForm({ ...form, outputLanguage: e.target.value as OutputLanguage })
              }
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={inputStyle}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Content in any language will be summarized and read aloud in your chosen language.
            </p>
          </div>

          {/* API Keys */}
          {!form.vipMode && (
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Your API Keys</h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  TL;Listen uses AI to summarize and generate audio. You&apos;ll need
                  two API keys to get started.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Anthropic API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.claudeApiKey}
                    onChange={(e) =>
                      setForm({ ...form, claudeApiKey: e.target.value, keysValidated: false })
                    }
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 font-mono"
                    style={inputStyle}
                  />
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    Powers the AI summarization. Requires a funded account (add billing at console.anthropic.com first).{" "}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent)" }}
                    >
                      Get your key here
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    ElevenLabs API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.elevenLabsApiKey}
                    onChange={(e) =>
                      setForm({ ...form, elevenLabsApiKey: e.target.value, keysValidated: false })
                    }
                    placeholder="sk_..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 font-mono"
                    style={inputStyle}
                  />
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    Powers the voice audio. When creating your key, enable at least &quot;Text to Speech&quot; and &quot;Voices: Read&quot; permissions.{" "}
                    <a
                      href="https://elevenlabs.io/app/settings/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent)" }}
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
                VIP access active -- using built-in API keys.
              </p>
            </div>
          )}

          {/* Voice ID */}
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Voice <span style={{ color: "var(--text-muted)" }} className="font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.elevenLabsVoiceId}
              onChange={(e) =>
                setForm({ ...form, elevenLabsVoiceId: e.target.value })
              }
              placeholder="Leave empty for defaults (Adam / Rachel)"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 font-mono"
              style={inputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Default: Adam (English), Rachel (other languages). Browse at{" "}
              <a
                href="https://elevenlabs.io/app/voice-library"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                elevenlabs.io/voice-library
              </a>
            </p>
          </div>

          {/* Privacy note */}
          <div
            className="rounded-lg p-3"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Your API keys are stored locally in your browser. When you generate
              a briefing, your keys are sent to our server to make API calls on
              your behalf -- they pass through our server but are never stored,
              logged, or shared.
            </p>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="bg-red-950/30 rounded-lg p-3 border border-red-800/30">
              <p className="text-xs text-red-400 whitespace-pre-wrap">{saveError}</p>
            </div>
          )}

          {/* VIP password */}
          {!form.vipMode && (
            <div className="pt-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
              <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>
                Have a VIP password?
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={vipPassword}
                  onChange={(e) => setVipPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={inputStyle}
                  onKeyDown={(e) => e.key === "Enter" && handleVipCheck()}
                />
                <button
                  onClick={handleVipCheck}
                  disabled={!vipPassword.trim() || saving}
                  className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-secondary)",
                  }}
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
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
          <button
            onClick={() => {
              onClear();
              setSaveError("");
            }}
            className="text-sm transition-colors hover:text-red-400"
            style={{ color: "var(--text-muted)" }}
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "Validating..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
