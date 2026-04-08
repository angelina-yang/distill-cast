import { YoutubeTranscript } from "youtube-transcript";
import { extractVideoId } from "./url-utils";

export async function extractYouTube(url: string) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Fetch title from oEmbed (no API key needed, works from any IP)
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

  // Try fetching transcript
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    if (!segments || segments.length === 0) {
      throw new Error("No transcript available for this video. The video may not have captions enabled.");
    }
    const content = segments.map((s) => s.text).join(" ");
    return { title, content, type: "youtube" as const, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Provide helpful error messages
    if (message.includes("Could not get transcripts") || message.includes("disabled")) {
      throw new Error(`No transcript available for "${title}". This video may not have captions enabled.`);
    }
    if (message.includes("Too Many Requests") || message.includes("429")) {
      throw new Error("YouTube is rate-limiting requests. Please try again in a few minutes.");
    }

    throw new Error(`Could not extract YouTube transcript: ${message}`);
  }
}
