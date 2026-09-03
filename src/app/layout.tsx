import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getBaseUrl } from "@/lib/env";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const satoshi = localFont({
  src: [
    {
      path: "../fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const title = "Sorano.app | Autonomous Growth for Indie Builders";
const description =
  "Turn your product updates into viral social posts, Google-ranked articles, and AI search recommendations - automatically.";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title,
  description,
  applicationName: "Sorano",
  icons: {
    icon: [
      { url: "/logo/favicon.svg", type: "image/svg+xml" },
      { url: "/logo/png/mark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/png/mark-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/logo/png/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title,
    description,
    siteName: "Sorano",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${satoshi.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
