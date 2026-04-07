import { NextRequest, NextResponse } from "next/server";
import { isYouTubeUrl } from "@/lib/url-utils";
import { extractYouTube } from "@/lib/extract-youtube";
import { extractArticle } from "@/lib/extract-article";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
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
