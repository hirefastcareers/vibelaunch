import { marketingPlanRows } from "@/lib/marketing/plan-copy";
import { getBaseUrl } from "@/lib/env";

export const SITE_NAME = "Xoopa";

export const HOME_TITLE = "AI Citation Tracking for SaaS & Indie Hackers | Xoopa";
export const HOME_DESCRIPTION =
  "See whether ChatGPT, Claude, Gemini, Perplexity, and Grok recommend your product, then close the loop with content fixes instead of just scorekeeping.";

export const PRICING_TITLE = "Pricing: Free, Starter & Pro | Xoopa";
export const PRICING_DESCRIPTION =
  "GEO plans for indie hackers and SaaS builders. Free to start. Starter and Pro raise prompts, models, competitors, and content suggestions.";

export type FaqItem = { question: string; answer: string };

export const PRICING_FAQS: FaqItem[] = [
  {
    question: "How does citation detection work?",
    answer:
      "Xoopa runs your tracked prompts against each model on your plan, stores the raw response, and records whether your brand was mentioned plus any cited URLs returned by the provider. Failed runs are stored as errors. We never invent a mention or citation.",
  },
  {
    question: "Why five models?",
    answer:
      "Indie hackers get asked about in different engines. ChatGPT, Claude, Gemini, Perplexity, and Grok cover the assistants people actually use today. Free includes three of them. Starter and Pro include all five.",
  },
  {
    question: "What happens when I hit a plan limit?",
    answer:
      "New tracked prompts, competitors, or content suggestions stop when you reach the hard cap for your tier. Pro’s suggestion allowance is a fair-use soft cap: generation can continue with a warning. Upgrade anytime from billing in the dashboard.",
  },
];

export function organizationJsonLd() {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: base,
    logo: `${base}/logo/png/apple-touch-icon.png`,
  };
}

export function softwareApplicationJsonLd() {
  const base = getBaseUrl();
  const offers = marketingPlanRows().map((row) => {
    const amount = Number(row.priceAmount.replace(/[^\d.]/g, "")) || 0;
    return {
      "@type": "Offer",
      name: row.label,
      price: amount.toFixed(2),
      priceCurrency: "GBP",
      url: `${base}/pricing`,
      description: `${row.trackedQueries} prompts · ${row.modelCount} models · ${row.runsPerWeek} · ${row.competitors} competitors · ${row.suggestions}`,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: base,
    description: HOME_DESCRIPTION,
    offers,
  };
}

export function faqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
