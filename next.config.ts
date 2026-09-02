import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Chromium/Playwright out of the webpack bundle so the serverless
  // function can load @sparticuz/chromium's binary at runtime.
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    // Both screenshot capture and video generation call launchServerlessChromium().
    // Scope the Chromium binary to every media route so a new caller cannot ship
    // without the binary in its serverless function bundle.
    "/api/media/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
