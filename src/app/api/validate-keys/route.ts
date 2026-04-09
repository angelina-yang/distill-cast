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
    } catch (err: unknown) {
      console.error("[ValidateKeys] Claude error:", err);
      if (err && typeof err === "object" && "status" in err) {
        const status = (err as { status: number }).status;
        if (status === 401) {
          results.errors.claude = "Invalid API key. Double-check you copied it correctly from console.anthropic.com.";
        } else if (status === 403) {
          results.errors.claude = "Your Anthropic account doesn't have API access. Make sure you've added billing at console.anthropic.com/settings/billing.";
        } else if (status === 429) {
          results.errors.claude = "Rate limited. Your Anthropic account may have exceeded its spending limit or has no credits. Check billing at console.anthropic.com.";
        } else {
          results.errors.claude = `Anthropic API error (${status}): ${err instanceof Error ? err.message : "Unknown error"}`;
        }
      } else {
        results.errors.claude = err instanceof Error ? err.message : "Could not validate Anthropic key";
      }
    }
  }

  // Validate ElevenLabs API key by listing voices
  if (elevenLabsApiKey) {
    try {
      const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey });
      await client.voices.getAll();
      results.elevenLabs = true;
    } catch (err: unknown) {
      console.error("[ValidateKeys] ElevenLabs error:", err);
      if (err && typeof err === "object" && "statusCode" in err) {
        const status = (err as { statusCode: number }).statusCode;
        // Check for missing_permissions in the error body
        const body = (err as { body?: { detail?: { status?: string; message?: string } } }).body;
        if (status === 401 && body?.detail?.status === "missing_permissions") {
          results.errors.elevenLabs = "Your API key is missing required permissions. Go to elevenlabs.io → Profile → API Keys, delete this key, and create a new one with at least \"Text to Speech\" and \"Voices: Read\" permissions enabled.";
        } else if (status === 401) {
          results.errors.elevenLabs = "Invalid API key. Go to elevenlabs.io → Profile → API Keys and copy your key.";
        } else if (status === 403) {
          results.errors.elevenLabs = "Your ElevenLabs account doesn't have API access. Check your plan at elevenlabs.io.";
        } else {
          results.errors.elevenLabs = `ElevenLabs API error (${status}): ${err instanceof Error ? err.message : "Unknown error"}`;
        }
      } else {
        results.errors.elevenLabs = err instanceof Error ? err.message : "Could not validate ElevenLabs key";
      }
    }
  }

  return NextResponse.json(results);
}
