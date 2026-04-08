import { extractVideoId } from "./url-utils";

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/**
 * Try multiple innertube client types to get captions.
 * YouTube restricts different clients differently from datacenter IPs.
 */
const INNERTUBE_CLIENTS = [
  {
    name: "WEB",
    context: {
      client: {
        hl: "en",
        gl: "US",
        clientName: "WEB",
        clientVersion: "2.20240313.05.00",
      },
    },
  },
  {
    // MWEB (mobile web) is often less restricted
    name: "MWEB",
    context: {
      client: {
        hl: "en",
        gl: "US",
        clientName: "MWEB",
        clientVersion: "2.20240313.05.00",
      },
    },
  },
  {
    // TV embedded client — often works when others are blocked
    name: "TVHTML5_SIMPLY_EMBEDDED",
    context: {
      client: {
        hl: "en",
        gl: "US",
        clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        clientVersion: "2.0",
      },
      thirdParty: {
        embedUrl: "https://www.google.com",
      },
    },
  },
];

/**
 * Fetch transcript by trying multiple innertube client types.
 * This avoids fetching the watch page (which YouTube blocks from datacenters).
 */
async function fetchTranscriptInnertube(
  videoId: string
): Promise<TranscriptSegment[]> {
  const errors: string[] = [];

  for (const client of INNERTUBE_CLIENTS) {
    try {
      console.log(`[YouTube] Trying innertube client: ${client.name}`);

      const playerRes = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "X-YouTube-Client-Name": "1",
            "X-YouTube-Client-Version": "2.20240313.05.00",
            Origin: "https://www.youtube.com",
            Referer: "https://www.youtube.com/",
          },
          body: JSON.stringify({
            context: client.context,
            videoId,
          }),
        }
      );

      if (!playerRes.ok) {
        errors.push(`${client.name}: HTTP ${playerRes.status}`);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const playerData: any = await playerRes.json();

      // Log what we got back
      const status = playerData?.playabilityStatus?.status;
      const reason = playerData?.playabilityStatus?.reason;
      const hasCaptions = !!playerData?.captions;
      console.log(
        `[YouTube] ${client.name}: status=${status}, reason=${reason || "none"}, hasCaptions=${hasCaptions}`
      );

      if (status === "LOGIN_REQUIRED") {
        errors.push(`${client.name}: login required`);
        continue;
      }
      if (status === "UNPLAYABLE") {
        errors.push(`${client.name}: unplayable - ${reason || "unknown"}`);
        continue;
      }
      if (status === "ERROR") {
        errors.push(`${client.name}: error - ${reason || "unknown"}`);
        continue;
      }

      const captions = playerData?.captions;
      if (!captions) {
        errors.push(`${client.name}: no captions in response`);
        continue;
      }

      const captionTracks =
        captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captionTracks || captionTracks.length === 0) {
        errors.push(`${client.name}: no caption tracks`);
        continue;
      }

      console.log(
        `[YouTube] ${client.name}: found ${captionTracks.length} caption track(s)`
      );

      // Prefer English manual, then English auto, then first available
      const manualTrack = captionTracks.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => t.languageCode === "en" && t.kind !== "asr"
      );
      const autoTrack = captionTracks.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => t.languageCode === "en"
      );
      const selectedTrack = manualTrack || autoTrack || captionTracks[0];

      console.log(
        `[YouTube] Using track: lang=${selectedTrack.languageCode}, kind=${selectedTrack.kind || "manual"}`
      );

      const segments = await fetchCaptionTrack(selectedTrack.baseUrl);
      console.log(
        `[YouTube] Success via ${client.name}: ${segments.length} segments`
      );
      return segments;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${client.name}: ${msg}`);
      console.error(`[YouTube] ${client.name} failed: ${msg}`);
    }
  }

  // All clients failed — try the watch page as last resort
  console.log("[YouTube] All innertube clients failed, trying watch page...");
  try {
    return await fetchTranscriptFromWatchPage(videoId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(`watch-page: ${msg}`);
    console.error(`[YouTube] Watch page also failed: ${msg}`);
  }

  throw new Error(
    `All transcript methods failed: ${errors.join("; ")}`
  );
}

/**
 * Last-resort: fetch the watch page and extract captions from embedded data.
 */
async function fetchTranscriptFromWatchPage(
  videoId: string
): Promise<TranscriptSegment[]> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&has_verified=1&bpctr=9999999999`;
  const pageRes = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+999",
    },
  });

  if (!pageRes.ok) {
    throw new Error(`Watch page returned ${pageRes.status}`);
  }

  const html = await pageRes.text();
  console.log(
    `[YouTube] Watch page size: ${html.length} chars, has ytInitialPlayerResponse: ${html.includes("ytInitialPlayerResponse")}`
  );

  // Extract the player response JSON using brace counting
  const marker = "ytInitialPlayerResponse";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) {
    // Log first 500 chars to see what YouTube returned
    console.error(
      `[YouTube] Watch page snippet: ${html.substring(0, 500)}`
    );
    throw new Error("ytInitialPlayerResponse not found in page");
  }

  // Find the opening brace
  const braceStart = html.indexOf("{", markerIdx);
  if (braceStart === -1) {
    throw new Error("Could not find JSON start in player response");
  }

  // Count braces to find the matching closing brace
  const jsonStr = extractJsonObject(html, braceStart);
  if (!jsonStr) {
    throw new Error("Could not extract JSON from player response");
  }

  return extractCaptionsFromJson(jsonStr);
}

/**
 * Extract a complete JSON object from a string starting at the given index,
 * using brace counting to handle nested objects correctly.
 */
function extractJsonObject(str: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < str.length && i < startIdx + 2_000_000; i++) {
    const ch = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      if (inString) escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return str.substring(startIdx, i + 1);
      }
    }
  }

  return null;
}

async function extractCaptionsFromJson(jsonStr: string): Promise<TranscriptSegment[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse player response JSON");
  }

  const status = data?.playabilityStatus?.status;
  console.log(`[YouTube] Watch page player status: ${status}`);

  if (status === "LOGIN_REQUIRED") {
    throw new Error("Video requires login (age-restricted?)");
  }

  const captions = data?.captions;
  if (!captions) {
    throw new Error("No captions in watch page player response");
  }

  const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    throw new Error("No caption tracks in watch page response");
  }

  const manualTrack = tracks.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.languageCode === "en" && t.kind !== "asr"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autoTrack = tracks.find((t: any) => t.languageCode === "en");
  const selected = manualTrack || autoTrack || tracks[0];

  return fetchCaptionTrack(selected.baseUrl);
}

async function fetchCaptionTrack(
  baseUrl: string
): Promise<TranscriptSegment[]> {
  const url = baseUrl.startsWith("http")
    ? baseUrl
    : `https://www.youtube.com${baseUrl}`;

  console.log(`[YouTube] Fetching caption track from: ${url.substring(0, 100)}...`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Caption track returned ${res.status}`);
  }

  const xml = await res.text();
  console.log(`[YouTube] Caption XML size: ${xml.length} chars`);

  const segments: TranscriptSegment[] = [];
  const textRegex =
    /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;

  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeXmlEntities(match[3].trim());
    if (text) {
      segments.push({ text, start, duration });
    }
  }

  if (segments.length === 0) {
    throw new Error("Transcript XML was empty or unparseable");
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

  console.log(`[YouTube] Extracting video: ${videoId}`);

  // Fetch title from oEmbed (no API key needed, reliable from any IP)
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

  // Try all methods to get transcript
  const segments = await fetchTranscriptInnertube(videoId);
  const content = segments.map((s) => s.text).join(" ");
  return { title, content, type: "youtube" as const, url };
}
