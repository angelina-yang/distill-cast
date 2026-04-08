import { extractVideoId } from "./url-utils";

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CLIENT_VERSION = "2.20240313.05.00";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/**
 * Fetches YouTube transcript using the innertube API directly.
 * This avoids the youtube-transcript npm package which gets blocked
 * on Vercel's datacenter IPs.
 */
async function fetchTranscriptDirect(
  videoId: string
): Promise<TranscriptSegment[]> {
  // Step 1: Get the video page to find transcript params
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const pageRes = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!pageRes.ok) {
    throw new Error(
      `YouTube returned ${pageRes.status}. The video may be unavailable.`
    );
  }

  const html = await pageRes.text();

  // Extract serialized player response to find captions config
  const playerMatch = html.match(
    /var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s
  );
  if (!playerMatch) {
    // Try alternate pattern
    const altMatch = html.match(
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});/s
    );
    if (!altMatch) {
      throw new Error(
        "Could not parse YouTube page. The video may be private or unavailable."
      );
    }
    return extractFromPlayerResponse(altMatch[1]);
  }

  return extractFromPlayerResponse(playerMatch[1]);
}

function extractFromPlayerResponse(jsonStr: string): TranscriptSegment[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let playerResponse: any;
  try {
    playerResponse = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse YouTube player data.");
  }

  // Check if video is playable
  const status = playerResponse?.playabilityStatus?.status;
  if (status === "LOGIN_REQUIRED") {
    throw new Error("This video requires login. It may be age-restricted.");
  }
  if (status === "UNPLAYABLE") {
    throw new Error("This video is unavailable or region-restricted.");
  }
  if (status === "ERROR") {
    throw new Error("This video does not exist or has been removed.");
  }

  // Get captions data
  const captions = playerResponse?.captions;
  if (!captions) {
    throw new Error(
      "No captions available for this video. It may not have subtitles enabled."
    );
  }

  const captionTracks =
    captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error(
      "No transcript tracks found. This video may not have captions."
    );
  }

  // Prefer English, fall back to first available, prefer non-auto-generated
  const manualTrack = captionTracks.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.languageCode === "en" && t.kind !== "asr"
  );
  const autoTrack = captionTracks.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.languageCode === "en"
  );
  const selectedTrack = manualTrack || autoTrack || captionTracks[0];

  return fetchCaptionTrack(selectedTrack.baseUrl);
}

async function fetchCaptionTrack(
  baseUrl: string
): Promise<TranscriptSegment[]> {
  // Fetch the actual transcript XML
  const url = baseUrl.startsWith("http")
    ? baseUrl
    : `https://www.youtube.com${baseUrl}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch transcript data (${res.status}).`);
  }

  const xml = await res.text();

  // Parse the XML transcript
  // Format: <text start="0.24" dur="5.28">Hello world</text>
  const segments: TranscriptSegment[] = [];
  const textRegex =
    /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;

  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    // Decode HTML entities in the text
    const text = decodeXmlEntities(match[3].trim());
    if (text) {
      segments.push({ text, start, duration });
    }
  }

  if (segments.length === 0) {
    throw new Error("Transcript is empty.");
  }

  return segments;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/\n/g, " ");
}

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

  // Fetch transcript using direct innertube approach
  try {
    const segments = await fetchTranscriptDirect(videoId);
    const content = segments.map((s) => s.text).join(" ");
    return { title, content, type: "youtube" as const, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // If direct approach fails, try the innertube API as fallback
    try {
      const segments = await fetchTranscriptInnertube(videoId);
      const content = segments.map((s) => s.text).join(" ");
      return { title, content, type: "youtube" as const, url };
    } catch (innerErr) {
      const innerMessage =
        innerErr instanceof Error ? innerErr.message : "Unknown error";
      console.error(
        `[YouTube] Both methods failed. Direct: ${message}. Innertube: ${innerMessage}`
      );
    }

    throw new Error(`Could not extract YouTube transcript: ${message}`);
  }
}

/**
 * Fallback: Use YouTube's innertube API to get transcript.
 * This doesn't require loading the watch page first.
 */
async function fetchTranscriptInnertube(
  videoId: string
): Promise<TranscriptSegment[]> {
  // First, get video info to find transcript params
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            hl: "en",
            gl: "US",
            clientName: "WEB",
            clientVersion: INNERTUBE_CLIENT_VERSION,
          },
        },
        videoId,
      }),
    }
  );

  if (!playerRes.ok) {
    throw new Error(`Innertube player API returned ${playerRes.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerData: any = await playerRes.json();
  const captions = playerData?.captions;

  if (!captions) {
    throw new Error("No captions via innertube API");
  }

  const captionTracks =
    captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No caption tracks via innertube API");
  }

  // Prefer English, fall back to first
  const manualTrack = captionTracks.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.languageCode === "en" && t.kind !== "asr"
  );
  const autoTrack = captionTracks.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.languageCode === "en"
  );
  const selectedTrack = manualTrack || autoTrack || captionTracks[0];

  return fetchCaptionTrack(selectedTrack.baseUrl);
}
