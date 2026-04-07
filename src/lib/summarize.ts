import Anthropic from "@anthropic-ai/sdk";
import { SUMMARIZE_PROMPT, buildSummarizeMessages } from "./prompts";

export async function summarize(
  title: string,
  content: string,
  type: "youtube" | "article",
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.CLAUDE_API_KEY;
  if (!key) {
    throw new Error("Anthropic API key is required. Please add it in Settings.");
  }

  const client = new Anthropic({ apiKey: key });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SUMMARIZE_PROMPT,
    messages: buildSummarizeMessages(title, content, type),
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}
