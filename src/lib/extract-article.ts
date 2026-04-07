import { extract } from "@extractus/article-extractor";

export async function extractArticle(url: string) {
  const article = await extract(url);
  if (!article || !article.content) {
    throw new Error("Could not extract article content");
  }

  // Strip HTML tags from extracted content
  const content = article.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const title = article.title || "Article";

  return { title, content, type: "article" as const, url };
}
