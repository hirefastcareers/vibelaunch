import type { MetadataRoute } from "next";
import { getBaseUrl, PRODUCTION_APP_ORIGINS } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const isProductionHost = PRODUCTION_APP_ORIGINS.some(
    (origin) => baseUrl === origin || baseUrl.startsWith(`${origin}/`)
  );

  // Preview / non-production hosts: discourage indexing of draft deploys.
  if (!isProductionHost) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/auth/", "/onboard/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
