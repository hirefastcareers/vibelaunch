/**
 * Fuzzy brand-mention detection against LLM raw text.
 * Real detection only — never invents a mention.
 */

export function detectBrandMention(
  rawResponse: string,
  brandName: string
): boolean {
  const brand = brandName.trim();
  if (!brand || !rawResponse.trim()) return false;

  const haystack = normalize(rawResponse);
  const variants = brandVariants(brand);

  return variants.some((variant) => haystack.includes(variant));
}

function brandVariants(brand: string): string[] {
  const base = normalize(brand);
  const variants = new Set<string>([base]);

  // Drop common corporate suffixes: "Acme Inc" → "acme"
  const stripped = base
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|company|ai|app|labs?|hq)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length >= 2) variants.add(stripped);

  // Compact form: "Open AI" → "openai"
  const compact = base.replace(/[\s._-]+/g, "");
  if (compact.length >= 2) variants.add(compact);

  // Hyphen / underscore variants of multi-word brands
  if (base.includes(" ")) {
    variants.add(base.replace(/\s+/g, "-"));
    variants.add(base.replace(/\s+/g, "_"));
    variants.add(base.replace(/\s+/g, ""));
  }

  return [...variants].filter((v) => v.length >= 2);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[®™©]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9._\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
