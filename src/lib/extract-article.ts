import { extract } from "@extractus/article-extractor";

function sanitizeText(html: string): string {
  // Strip all HTML tags
  let text = html.replace(/<[^>]*>/g, " ");
  // Remove any remaining HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Remove script/event handler patterns just in case
  text = text.replace(/javascript:/gi, "");
  text = text.replace(/on\w+\s*=/gi, "");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export async function extractArticle(url: string) {
  const article = await extract(url);
  if (!article || !article.content) {
    throw new Error("Could not extract article content");
  }

  const content = sanitizeText(article.content);
  const title = sanitizeText(article.title || "Article");

  return { title, content, type: "article" as const, url };
}
