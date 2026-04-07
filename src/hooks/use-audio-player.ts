"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PlaylistItem } from "@/types";

export function useAudioPlayer(items: PlaylistItem[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIntro, setPlayingIntro] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [finished, setFinished] = useState(false);
  // Track which items have been auto-played to prevent re-triggering
  const autoPlayedRef = useRef<Set<number>>(new Set());

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const playItem = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const item = items[index];
      if (!item || item.status !== "ready" || !item.audioUrl) return;

      setCurrentIndex(index);
      setFinished(false);
      autoPlayedRef.current.add(index);

      // Play intro first (skip for first item)
      if (index > 0 && item.introAudioUrl) {
        setPlayingIntro(true);
        audio.src = item.introAudioUrl;
        audio.play().catch(() => {});

        audio.onended = () => {
          setPlayingIntro(false);
          audio.src = item.audioUrl!;
          audio.play().catch(() => {});
          audio.onended = () => advanceToNext(index);
        };
      } else {
        setPlayingIntro(false);
        audio.src = item.audioUrl;
        audio.play().catch(() => {});
        audio.onended = () => advanceToNext(index);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  const advanceToNext = useCallback(
    (fromIndex: number) => {
      const audio = audioRef.current;
      const nextIndex = fromIndex + 1;
      if (nextIndex < items.length) {
        const nextItem = items[nextIndex];
        if (nextItem && nextItem.status === "ready") {
          playItem(nextIndex);
        } else {
          // Wait for the next item to become ready
          setCurrentIndex(nextIndex);
          setIsPlaying(false);
        }
      } else {
        // Playlist finished — stop completely
        if (audio) {
          audio.onended = null;
        }
        setIsPlaying(false);
        setFinished(true);
      }
    },
    [items, playItem]
  );

  // Auto-play next item when it becomes ready (only for items waiting to play)
  useEffect(() => {
    if (finished) return;
    if (currentIndex >= 0 && !isPlaying && !playingIntro) {
      const item = items[currentIndex];
      if (
        item &&
        item.status === "ready" &&
        item.audioUrl &&
        !autoPlayedRef.current.has(currentIndex)
      ) {
        playItem(currentIndex);
      }
    }
  }, [items, currentIndex, isPlaying, playingIntro, playItem, finished]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else if (finished) {
      // Replay from the beginning
      setFinished(false);
      autoPlayedRef.current.clear();
      const firstReady = items.findIndex((i) => i.status === "ready");
      if (firstReady >= 0) playItem(firstReady);
    } else if (currentIndex >= 0) {
      audio.play().catch(() => {});
    } else {
      // Start from the first ready item
      const firstReady = items.findIndex((i) => i.status === "ready");
      if (firstReady >= 0) playItem(firstReady);
    }
  }, [isPlaying, finished, currentIndex, items, playItem]);

  const skipNext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = null;
    setFinished(false);

    const nextReadyIndex = items.findIndex(
      (item, i) => i > currentIndex && item.status === "ready"
    );
    if (nextReadyIndex >= 0) {
      playItem(nextReadyIndex);
    }
  }, [currentIndex, items, playItem]);

  const skipPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = null;
    setFinished(false);

    // If more than 3 seconds in, restart current
    if (currentTime > 3 && currentIndex >= 0) {
      audio.currentTime = 0;
      return;
    }

    const prevReadyIndex = [...items]
      .map((item, i) => ({ item, i }))
      .filter(({ item, i }) => i < currentIndex && item.status === "ready")
      .pop();

    if (prevReadyIndex) {
      playItem(prevReadyIndex.i);
    }
  }, [currentTime, currentIndex, items, playItem]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const currentItem = currentIndex >= 0 ? items[currentIndex] : null;

  return {
    currentIndex,
    currentItem,
    isPlaying,
    playingIntro,
    currentTime,
    duration,
    finished,
    togglePlayPause,
    skipNext,
    skipPrevious,
    playItem,
    seek,
  };
}
