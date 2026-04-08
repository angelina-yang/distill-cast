import { NextRequest, NextResponse } from "next/server";
import { isYouTubeUrl } from "@/lib/url-utils";
import { extractYouTube } from "@/lib/extract-youtube";
import { extractArticle } from "@/lib/extract-article";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 30;

// 20 extractions per IP per minute
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    if (isRateLimited(`extract:${ip}`, MAX_REQUESTS, WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = isYouTubeUrl(url)
      ? await extractYouTube(url)
      : await extractArticle(url);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
