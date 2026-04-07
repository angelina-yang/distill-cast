"use client";

import { useState, useEffect, useCallback } from "react";

export interface ApiKeys {
  claudeApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
}

const STORAGE_KEY = "distill-cast-api-keys";

const DEFAULTS: ApiKeys = {
  claudeApiKey: "",
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "s3TPKV1kjDlVtZbl4Ksh",
};

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
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

  const hasKeys = Boolean(keys.claudeApiKey && keys.elevenLabsApiKey);

  return { keys, hasKeys, loaded, saveKeys, clearKeys };
}
