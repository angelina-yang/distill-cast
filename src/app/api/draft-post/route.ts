import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildDraftPostPrompt } from "@/lib/prompts";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { platform, summary, title, instructions } = await req.json();

    if (!summary || !platform) {
      return NextResponse.json(
        { error: "Summary and platform are required" },
        { status: 400 }
      );
    }

    if (platform !== "tweet" && platform !== "linkedin") {
      return NextResponse.json(
        { error: "Platform must be 'tweet' or 'linkedin'" },
        { status: 400 }
      );
    }

    const apiKey = req.headers.get("x-claude-api-key") || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key is required" },
        { status: 500 }
      );
    }

    const { system, userMessage } = buildDraftPostPrompt(
      platform,
      summary,
      title || "Untitled",
      instructions
    );

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return NextResponse.json({ draft: textBlock.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Draft generation failed";
    console.error(`[DraftPost] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
