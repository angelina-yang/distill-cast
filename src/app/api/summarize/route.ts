import { NextRequest, NextResponse } from "next/server";
import { summarize } from "@/lib/summarize";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { title, content, type, language } = await req.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const apiKey = req.headers.get("x-claude-api-key") || undefined;
    const summary = await summarize(
      title || "Untitled",
      content,
      type || "article",
      apiKey,
      language || "en"
    );
    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
