const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

export function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export function parseUrls(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      try {
        new URL(line);
        return true;
      } catch {
        return false;
      }
    });
}
