"use client";

import { useState, useCallback } from "react";
import { PlaylistItem, ItemStatus, ReadMode } from "@/types";
import { isYouTubeUrl } from "@/lib/url-utils";
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

    // Step 2: Summarize (skip in "full" mode — read the article as-is)
    let ttsText: string;
    if (item.readMode === "full") {
      updateItem(item.id, { status: "summarizing", summary: content });
      ttsText = content;
    } else {
      updateItem(item.id, { status: "summarizing" });
      const sumRes = await fetch("/api/summarize", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, content, type, language: keys.outputLanguage }),
      });
      if (!sumRes.ok) {
        const err = await sumRes.json();
        throw new Error(err.error || "Summarization failed");
      }
      const { summary } = await sumRes.json();
      updateItem(item.id, { summary });
      ttsText = summary;
    }

    // Step 3: Generate TTS for intro
    updateItem(item.id, { status: "generating-audio" });
    const introRes = await fetch("/api/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: `Next up: ${title}`, language: keys.outputLanguage }),
    });
    let introAudioUrl: string | null = null;
    if (introRes.ok) {
      const introBlob = await introRes.blob();
      introAudioUrl = URL.createObjectURL(introBlob);
    }

    // Step 4: Generate TTS for content
    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: ttsText, language: keys.outputLanguage }),
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

  // Append new URLs to existing playlist
  const addUrls = useCallback(
    (urls: string[], readMode: ReadMode = "summary") => {
      const newItems: PlaylistItem[] = urls.map((url) => ({
        id: generateId(),
        url,
        type: "article" as const,
        title: url,
        content: "",
        summary: "",
        readMode: isYouTubeUrl(url) ? "summary" as ReadMode : readMode,
        introAudioUrl: null,
        audioUrl: null,
        status: "queued" as ItemStatus,
        done: false,
      }));

      setItems((prev) => [...prev, ...newItems]);
      setIsProcessing(true);

      // Process new items with concurrency of 2
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

  // Mark an item as done/listened
  const toggleDone = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  }, []);

  // Remove a single item
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
        if (item.introAudioUrl) URL.revokeObjectURL(item.introAudioUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // Re-process an article in a different read mode (full ↔ summary)
  const reprocessItem = useCallback(
    (id: string, newMode: ReadMode) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item || item.type === "youtube") return prev;

        // Revoke old audio
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
        if (item.introAudioUrl) URL.revokeObjectURL(item.introAudioUrl);

        const updated = prev.map((i) =>
          i.id === id
            ? {
                ...i,
                readMode: newMode,
                audioUrl: null,
                introAudioUrl: null,
                summary: "",
                status: "queued" as ItemStatus,
                error: undefined,
                done: false,
              }
            : i
        );

        // Re-process the item (content is already extracted)
        const updatedItem = updated.find((i) => i.id === id)!;
        setIsProcessing(true);
        processItem(updatedItem, keys, updateItem).then(() => {
          setIsProcessing(false);
        });

        return updated;
      });
    },
    [keys, updateItem]
  );

  // Clear all items
  const clearAll = useCallback(() => {
    items.forEach((item) => {
      if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      if (item.introAudioUrl) URL.revokeObjectURL(item.introAudioUrl);
    });
    setItems([]);
    setIsProcessing(false);
  }, [items]);

  return { items, isProcessing, addUrls, toggleDone, removeItem, reprocessItem, clearAll };
}
