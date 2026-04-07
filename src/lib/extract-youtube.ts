import { YoutubeTranscript } from "youtube-transcript";
import { extractVideoId } from "./url-utils";

export async function extractYouTube(url: string) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  const content = segments.map((s) => s.text).join(" ");

  // Fetch title from oEmbed (no API key needed)
  let title = "YouTube Video";
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      title = data.title;
    }
  } catch {
    // Fall back to generic title
  }

  return { title, content, type: "youtube" as const, url };
}
