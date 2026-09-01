import type { Metadata } from "next";
import "./globals.css";

const title = "Sorano.app | Autonomous Growth & GEO Engine";
const description =
  "Continuous organic growth, Playwright UI media capture, social-to-static SEO, and Generative Engine Optimization (GEO).";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Sorano",
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
