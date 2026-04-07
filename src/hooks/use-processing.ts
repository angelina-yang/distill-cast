"use client";

import { useState, useCallback } from "react";
import { PlaylistItem, ItemStatus } from "@/types";
import { ApiKeys } from "./use-api-keys";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildHeaders(keys: ApiKeys) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (keys.claudeApiKey) headers["x-claude-api-key"] = keys.claudeApiKey;
  if (keys.elevenLabsApiKey) headers["x-elevenlabs-api-key"] = keys.elevenLabsApiKey;
  if (keys.elevenLabsVoiceId) headers["x-elevenlabs-voice-id"] = keys.elevenLabsVoiceId;
  return headers;
}

async function processItem(
  item: PlaylistItem,
  keys: ApiKeys,
  updateItem: (id: string, updates: Partial<PlaylistItem>) => void
) {
  const headers = buildHeaders(keys);

  try {
    // Step 1: Extract
    updateItem(item.id, { status: "extracting" });
    const extractRes = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: item.url }),
    });
    if (!extractRes.ok) {
      const err = await extractRes.json();
      throw new Error(err.error || "Extraction failed");
    }
    const { title, content, type } = await extractRes.json();
    updateItem(item.id, { title, content, type });

    // Step 2: Summarize
    updateItem(item.id, { status: "summarizing" });
    const sumRes = await fetch("/api/summarize", {
      method: "POST",
      headers,
      body: JSON.stringify({ title, content, type }),
    });
    if (!sumRes.ok) {
      const err = await sumRes.json();
      throw new Error(err.error || "Summarization failed");
    }
    const { summary } = await sumRes.json();
    updateItem(item.id, { summary });

    // Step 3: Generate TTS for intro
    updateItem(item.id, { status: "generating-audio" });
    const introRes = await fetch("/api/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: `Next up: ${title}` }),
    });
    let introAudioUrl: string | null = null;
    if (introRes.ok) {
      const introBlob = await introRes.blob();
      introAudioUrl = URL.createObjectURL(introBlob);
    }

    // Step 4: Generate TTS for summary
    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: summary }),
    });
    if (!ttsRes.ok) {
      throw new Error("TTS generation failed");
    }
    const audioBlob = await ttsRes.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    updateItem(item.id, {
      introAudioUrl,
      audioUrl,
      status: "ready",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    updateItem(item.id, { status: "error", error: message });
  }
}

export function useProcessing(keys: ApiKeys) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateItem = useCallback(
    (id: string, updates: Partial<PlaylistItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const submitUrls = useCallback(
    (urls: string[]) => {
      const newItems: PlaylistItem[] = urls.map((url) => ({
        id: generateId(),
        url,
        type: "article" as const,
        title: url,
        content: "",
        summary: "",
        introAudioUrl: null,
        audioUrl: null,
        status: "queued" as ItemStatus,
      }));

      setItems(newItems);
      setIsProcessing(true);

      // Process with concurrency of 2
      const queue = [...newItems];
      let active = 0;
      const maxConcurrency = 2;

      function next() {
        while (active < maxConcurrency && queue.length > 0) {
          const item = queue.shift()!;
          active++;
          processItem(item, keys, updateItem).then(() => {
            active--;
            if (queue.length === 0 && active === 0) {
              setIsProcessing(false);
            }
            next();
          });
        }
      }
      next();
    },
    [keys, updateItem]
  );

  const clearAll = useCallback(() => {
    items.forEach((item) => {
      if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      if (item.introAudioUrl) URL.revokeObjectURL(item.introAudioUrl);
    });
    setItems([]);
    setIsProcessing(false);
  }, [items]);

  return { items, isProcessing, submitUrls, clearAll };
}
