import { extractVideoId } from "./url-utils";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/**
 * Public Invidious instances with API access.
 * These are community-run YouTube proxies that aren't blocked by YouTube's
 * datacenter IP detection. We try multiple in case one is down.
 */
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.jing.rocks",
  "https://invidious.privacyredirect.com",
  "https://iv.nboeck.de",
];

/**
 * Fetch transcript via Invidious API.
 * Invidious is an open-source YouTube frontend that proxies requests
 * through non-datacenter IPs, bypassing YouTube's bot detection.
 */
async function fetchTranscriptInvidious(
  videoId: string
): Promise<{ segments: TranscriptSegment[]; title: string }> {
  const errors: string[] = [];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`[YouTube] Trying Invidious instance: ${instance}`);

      // First get video info (includes title)
      const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!infoRes.ok) {
        errors.push(`${instance}: video info returned ${infoRes.status}`);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoInfo: any = await infoRes.json();
      const title = videoInfo.title || "YouTube Video";

      // Get captions list
      const captions = videoInfo.captions;
      if (!captions || captions.length === 0) {
        // Try the captions endpoint directly
        const captionsRes = await fetch(
          `${instance}/api/v1/captions/${videoId}`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          }
        );

        if (!captionsRes.ok) {
          errors.push(`${instance}: no captions available`);
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const captionsData: any = await captionsRes.json();
        const captionsList = captionsData.captions;

        if (!captionsList || captionsList.length === 0) {
          errors.push(`${instance}: empty captions list`);
          continue;
        }

        const segments = await fetchInvidiousCaptions(
          instance,
          videoId,
          captionsList
        );
        console.log(
          `[YouTube] Success via ${instance}: ${segments.length} segments`
        );
        return { segments, title };
      }

      // Use captions from video info
      const segments = await fetchInvidiousCaptions(
        instance,
        videoId,
        captions
      );
      console.log(
        `[YouTube] Success via ${instance}: ${segments.length} segments`
      );
      return { segments, title };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("timed out") || msg.includes("abort")) {
        errors.push(`${instance}: timed out`);
      } else {
        errors.push(`${instance}: ${msg}`);
      }
      console.error(`[YouTube] ${instance} failed: ${msg}`);
    }
  }

  throw new Error(
    `All Invidious instances failed: ${errors.join("; ")}`
  );
}

async function fetchInvidiousCaptions(
  instance: string,
  videoId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  captionsList: any[]
): Promise<TranscriptSegment[]> {
  // Prefer English manual captions, then English auto, then first available
  const manualEn = captionsList.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) =>
      c.language_code === "en" &&
      !c.label?.toLowerCase().includes("auto")
  );
  const autoEn = captionsList.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.language_code === "en"
  );
  const selected = manualEn || autoEn || captionsList[0];

  console.log(
    `[YouTube] Using caption: lang=${selected.language_code}, label=${selected.label}`
  );

  // Fetch the actual caption content
  // The Invidious API returns captions in various formats
  // Use the label to construct the URL, or use the direct URL if available
  let captionUrl: string;
  if (selected.url) {
    // Some instances return absolute URLs, others return relative
    captionUrl = selected.url.startsWith("http")
      ? selected.url
      : `${instance}${selected.url}`;
  } else {
    captionUrl = `${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(selected.label)}`;
  }

  const captionRes = await fetch(captionUrl, {
    signal: AbortSignal.timeout(5000),
  });

  if (!captionRes.ok) {
    throw new Error(`Caption download returned ${captionRes.status}`);
  }

  const contentType = captionRes.headers.get("content-type") || "";
  const body = await captionRes.text();

  console.log(
    `[YouTube] Caption response: ${body.length} chars, type=${contentType}`
  );

  // Parse based on format — could be XML (srv1/srv3) or VTT
  if (body.includes("<text") || body.includes("<body")) {
    return parseXmlCaptions(body);
  }
  if (body.includes("WEBVTT") || body.includes("-->")) {
    return parseVttCaptions(body);
  }

  // Try XML parsing as default
  return parseXmlCaptions(body);
}

function parseXmlCaptions(xml: string): TranscriptSegment[] {
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

  // Try alternate XML format (srv3)
  if (segments.length === 0) {
    const pRegex =
      /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    while ((match = pRegex.exec(xml)) !== null) {
      const start = parseInt(match[1]) / 1000;
      const duration = parseInt(match[2]) / 1000;
      const text = decodeXmlEntities(match[3].replace(/<[^>]+>/g, "").trim());
      if (text) {
        segments.push({ text, start, duration });
      }
    }
  }

  if (segments.length === 0) {
    throw new Error("Could not parse caption XML");
  }

  return segments;
}

function parseVttCaptions(vtt: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  // Match VTT cues: "00:00:01.234 --> 00:00:05.678\nText here"
  const cueRegex =
    /(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})\n([\s\S]*?)(?=\n\n|\n\d{2}:|\s*$)/g;

  let match;
  while ((match = cueRegex.exec(vtt)) !== null) {
    const start = parseVttTimestamp(match[1]);
    const end = parseVttTimestamp(match[2]);
    const text = match[3]
      .replace(/<[^>]+>/g, "") // strip HTML tags
      .replace(/\n/g, " ")
      .trim();
    if (text) {
      segments.push({ text, start, duration: end - start });
    }
  }

  if (segments.length === 0) {
    throw new Error("Could not parse VTT captions");
  }

  return segments;
}

function parseVttTimestamp(ts: string): number {
  const parts = ts.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const [seconds, ms] = parts[2].split(".");
  return hours * 3600 + minutes * 60 + parseInt(seconds) + parseInt(ms) / 1000;
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

  // Use Invidious API — bypasses YouTube's datacenter IP blocking
  const { segments, title } = await fetchTranscriptInvidious(videoId);
  const content = segments.map((s) => s.text).join(" ");
  return { title, content, type: "youtube" as const, url };
}
