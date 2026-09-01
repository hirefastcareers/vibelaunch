/**
 * SEO content expander: turns a short summary into full SEO-optimized changelog content.
 */
export interface SeoExpandedContent {
  title: string;
  seoTitle: string;
  seoDesc: string;
  body: string;
  keywords: string[];
  slug: string;
}

export async function expandForSeo(
  title: string,
  summary: string,
  projectName: string,
  keywords?: string[]
): Promise<SeoExpandedContent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return expandWithOpenAI(title, summary, projectName, keywords);
  }
  return expandFallback(title, summary, projectName, keywords);
}

async function expandWithOpenAI(
  title: string,
  summary: string,
  projectName: string,
  keywords?: string[]
): Promise<SeoExpandedContent> {
  const prompt = `Expand this product changelog entry into SEO-optimized content.

Product: ${projectName}
Title: ${title}
Summary: ${summary}
Keywords: ${keywords?.join(", ") ?? "auto-detect"}

Return JSON with: seoTitle (max 60 chars), seoDesc (max 160 chars), body (markdown, 300-800 words), keywords (array of 5-10 strings), slug (lowercase-hyphenated).`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI SEO expand error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const parsed = JSON.parse(data.choices[0].message.content) as {
    seoTitle: string;
    seoDesc: string;
    body: string;
    keywords: string[];
    slug: string;
  };

  return { title, ...parsed };
}

function expandFallback(
  title: string,
  summary: string,
  projectName: string,
  keywords?: string[]
): SeoExpandedContent {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const body = `# ${title}

${summary}

## What's New in ${projectName}

We're thrilled to announce this latest update to ${projectName}. ${summary}

### Key Highlights

- Improved user experience
- Performance optimizations
- Bug fixes and stability improvements

### Get Started

Visit our website to try the latest version of ${projectName} today.

---

*Published by Sorano*`;

  return {
    title,
    seoTitle: `${title} | ${projectName} Changelog`.slice(0, 60),
    seoDesc: summary.slice(0, 160),
    body,
    keywords: keywords ?? [projectName.toLowerCase(), "changelog", "update", slug],
    slug,
  };
}

export function generateSitemapEntries(
  baseUrl: string,
  entries: Array<{ slug: string; publishedAt: Date | null }>
): string {
  const urls = entries
    .filter((e) => e.publishedAt)
    .map(
      (e) => `  <url>
    <loc>${baseUrl}/changelog/${e.slug}</loc>
    <lastmod>${e.publishedAt!.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;
}
