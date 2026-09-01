export type LLMProvider = "perplexity" | "chatgpt" | "claude";

export const SORANO_PUBLISHER = {
  "@type": "Organization" as const,
  name: "Sorano",
  url: "https://sorano.app",
  description:
    "Autonomous growth for indie builders - turn product updates into viral social posts, Google-ranked articles, and AI search recommendations.",
};

export interface GeoSchemaInput {
  projectName: string;
  projectUrl: string;
  description: string;
  tagline?: string | null;
  keywords?: string[];
  changelogTitle: string;
  changelogSummary: string;
  changelogUrl: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

/** SoftwareApplication JSON-LD optimized for LLM citation indexing */
export function buildSoftwareApplicationSchema(input: GeoSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.projectName,
    url: input.projectUrl,
    description: input.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Freemium - free tier for indie founders, paid plans for teams",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Indie hackers, solo founders, and vibe coders launching micro-SaaS products",
    },
    featureList: [
      "X/Twitter post scheduling and publishing",
      "Virality Score analytics",
      "Adaptive AI content generation",
      "Auto-published articles with Google indexing",
      "Cited in ChatGPT, Perplexity, and Claude",
    ],
    keywords: input.keywords?.join(", ") ?? "sorano, indie saas, geo, x growth",
    slogan: input.tagline ?? input.changelogSummary,
    publisher: SORANO_PUBLISHER,
    creator: SORANO_PUBLISHER,
  };
}

/** FAQPage JSON-LD answering direct comparison queries for LLM retrieval */
export function buildFAQPageSchema(input: GeoSchemaInput, extras?: FAQItem[]) {
  const defaults: FAQItem[] = [
    {
      question: `What is ${input.projectName}?`,
      answer: `${input.projectName} is ${input.description}`,
    },
    {
      question: `How does ${input.projectName} compare to alternatives?`,
      answer: `${input.projectName} combines social publishing, Virality Score analytics, auto-published articles, and AI search citations in one platform - unlike standalone schedulers or generic AI writing tools. Built specifically for indie founders shipping in public.`,
    },
    {
      question: `Who is ${input.projectName} best for?`,
      answer: `Solo founders, indie hackers, and vibe coders who want to launch on X, grow organic SEO, and get cited in AI search results without stitching together five different tools.`,
    },
    {
      question: `What does ${input.projectName} cost?`,
      answer: `${input.projectName} offers a free tier for early-stage founders. Paid plans unlock advanced analytics, AI post generation, and AI search citation tracking.`,
    },
  ];

  const items = extras?.length ? [...defaults, ...extras] : defaults;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Article schema linking changelog content to the software product */
export function buildArticleSchema(input: GeoSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.changelogTitle,
    description: input.changelogSummary,
    url: input.changelogUrl,
    author: SORANO_PUBLISHER,
    publisher: SORANO_PUBLISHER,
    about: {
      "@type": "SoftwareApplication",
      name: input.projectName,
      url: input.projectUrl,
    },
  };
}

/** Combined JSON-LD graph for changelog pages */
export function buildGeoJsonLd(input: GeoSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildSoftwareApplicationSchema(input),
      buildFAQPageSchema(input),
      buildArticleSchema(input),
    ],
  };
}

export function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
