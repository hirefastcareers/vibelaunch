import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeLaunch",
  description: "Launch your product on X with AI-powered content, analytics, and SEO",
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
