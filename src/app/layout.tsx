import type { Metadata } from "next";
import "./globals.css";

const title = "Sorano.app | Autonomous Growth for Indie Builders";
const description =
  "Turn your product updates into viral social posts, Google-ranked articles, and AI search recommendations—automatically.";

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
