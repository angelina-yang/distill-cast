"use client";

import { useState, useEffect, useCallback } from "react";

export type OutputLanguage = "en" | "zh" | "es" | "ja" | "ko" | "fr" | "de" | "pt";

export const LANGUAGES: { code: OutputLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
];

export interface ApiKeys {
  claudeApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  outputLanguage: OutputLanguage;
  vipMode: boolean; // true = use server-side keys, skip API key requirement
  keysValidated: boolean; // true = keys have been tested and work
}

const STORAGE_KEY = "distill-cast-api-keys";

const DEFAULTS: ApiKeys = {
  claudeApiKey: "",
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "",
  outputLanguage: "en",
  vipMode: false,
  keysValidated: false,
};

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setKeys({ ...DEFAULTS, ...parsed });
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  const saveKeys = useCallback((newKeys: ApiKeys) => {
    setKeys(newKeys);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newKeys));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearKeys = useCallback(() => {
    setKeys(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // User is ready if: VIP mode OR both keys are validated
  const hasKeys = keys.vipMode || (Boolean(keys.claudeApiKey && keys.elevenLabsApiKey) && keys.keysValidated);

  return { keys, hasKeys, loaded, saveKeys, clearKeys };
}
