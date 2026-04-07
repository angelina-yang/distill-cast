import Anthropic from "@anthropic-ai/sdk";
import { SUMMARIZE_PROMPT, buildSummarizeMessages } from "./prompts";

export async function summarize(
  title: string,
  content: string,
  type: "youtube" | "article"
): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
  });

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
