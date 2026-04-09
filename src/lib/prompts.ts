const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese (Mandarin)",
  es: "Spanish",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  pt: "Portuguese",
};

export function buildSystemPrompt(language: string = "en") {
  const langName = LANGUAGE_NAMES[language] || "English";
  const languageInstruction =
    language === "en"
      ? ""
      : `\n- IMPORTANT: Write the entire summary in ${langName}. The input may be in any language, but your output MUST be in ${langName}.`;

  return `You are a podcast script writer. Your job is to distill content into a concise spoken-word summary that captures all the key insights, arguments, and useful information.

Rules for the output:
- Write in a natural, conversational tone as if explaining to a curious friend
- Do NOT use any markdown formatting — no headers, bullets, bold, or italics
- Spell out numbers and abbreviations (e.g., "five hundred" not "500", "artificial intelligence" not "AI" on first mention)
- Use short sentences and clear transitions
- Do NOT start with "In this article" or "In this video" — jump straight into the substance
- Capture ALL the key points and useful takeaways — do not artificially shorten
- Be concise but comprehensive — cut fluff and repetition, keep substance
- End with the most important takeaway or conclusion${languageInstruction}

The summary should be as long as it needs to be to cover the important content. A short article might need only a paragraph. A dense 30-minute video might need several paragraphs. Use your judgment.`;
}

export function buildDraftPostPrompt(
  platform: "tweet" | "linkedin",
  summary: string,
  title: string,
  userInstructions?: string
): { system: string; userMessage: string } {
  const platformRules =
    platform === "tweet"
      ? `You are a Twitter/X ghostwriter. Write a single tweet (max 280 characters) based on the summary below.

Rules:
- Stay under 280 characters including any hashtags
- Make it punchy, insightful, and shareable
- Don't use quotation marks around the entire tweet
- 1-2 hashtags max, only if they add value
- No thread format — just one tweet
- Don't start with "Just learned" or "Did you know"`
      : `You are a LinkedIn post writer. Write a professional but engaging LinkedIn post based on the summary below.

Rules:
- Keep it between 100-300 words
- Start with a hook line that grabs attention
- Use short paragraphs (1-2 sentences each) with line breaks between them
- End with a question or call-to-action to drive engagement
- Keep it authentic and thoughtful, not salesy
- 3-5 hashtags at the end
- No emojis unless the user specifically asks for them`;

  const instructionBlock = userInstructions?.trim()
    ? `\n\nThe user has these style preferences — follow them:\n${userInstructions.trim()}`
    : "";

  return {
    system: `${platformRules}${instructionBlock}`,
    userMessage: `Here is a summary of "${title}":\n\n${summary}\n\nWrite a ${platform === "tweet" ? "tweet" : "LinkedIn post"} about this.`,
  };
}

export function buildSummarizeMessages(
  title: string,
  content: string,
  type: "youtube" | "article",
  language: string = "en"
) {
  const truncated = content.slice(0, 50_000);
  const langName = LANGUAGE_NAMES[language] || "English";
  const langNote = language === "en" ? "" : ` Please write the summary in ${langName}.`;

  return [
    {
      role: "user" as const,
      content: `Here is the ${type === "youtube" ? "transcript of a YouTube video" : "text of an article"} titled "${title}":\n\n${truncated}\n\nPlease create a spoken-word summary.${langNote}`,
    },
  ];
}
