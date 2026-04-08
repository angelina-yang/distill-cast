import { extractVideoId } from "./url-utils";

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

export async function extractYouTube(url: string) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  if (!SUPADATA_API_KEY) {
    throw new Error(
      "YouTube extraction requires SUPADATA_API_KEY environment variable."
    );
  }

  console.log(`[YouTube] Extracting video: ${videoId}`);

  // Fetch title from oEmbed (free, no API key needed)
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

  // Fetch transcript via Supadata API
  const transcriptRes = await fetch(
    `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`,
    {
      headers: {
        "x-api-key": SUPADATA_API_KEY,
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!transcriptRes.ok) {
    const status = transcriptRes.status;
    if (status === 401 || status === 403) {
      throw new Error("Invalid Supadata API key.");
    }
    if (status === 429) {
      throw new Error(
        "YouTube transcript quota exceeded. Try again later or upgrade your Supadata plan."
      );
    }
    if (status === 404) {
      throw new Error(
        `No transcript available for "${title}". This video may not have captions.`
      );
    }
    throw new Error(`Supadata API returned ${status}.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await transcriptRes.json();
  const segments = data.content;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    throw new Error(
      `No transcript found for "${title}". This video may not have captions enabled.`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = segments.map((s: any) => s.text).join(" ");

  if (!content.trim()) {
    throw new Error("Transcript was empty after extraction.");
  }

  console.log(
    `[YouTube] Success: ${segments.length} segments, ${content.length} chars for "${title}"`
  );

  return { title, content, type: "youtube" as const, url };
}
