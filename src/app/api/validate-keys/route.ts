import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const { claudeApiKey, elevenLabsApiKey } = await req.json();
  const results: { claude: boolean; elevenLabs: boolean; errors: Record<string, string> } = {
    claude: false,
    elevenLabs: false,
    errors: {},
  };

  // Validate Claude API key with a minimal request
  if (claudeApiKey) {
    try {
      const client = new Anthropic({ apiKey: claudeApiKey });
      await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5,
        messages: [{ role: "user", content: "Hi" }],
      });
      results.claude = true;
    } catch (err) {
      results.errors.claude =
        err instanceof Error ? err.message : "Invalid Anthropic API key";
    }
  }

  // Validate ElevenLabs API key by listing voices
  if (elevenLabsApiKey) {
    try {
      const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey });
      await client.voices.getAll();
      results.elevenLabs = true;
    } catch (err) {
      results.errors.elevenLabs =
        err instanceof Error ? err.message : "Invalid ElevenLabs API key";
    }
  }

  return NextResponse.json(results);
}
