"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import Link from "next/link";

interface DashboardShellProps {
  children: React.ReactNode;
  userLabel?: string;
}

export function DashboardShell({ children, userLabel }: DashboardShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <div className="hidden lg:flex">
        <Sidebar
          userLabel={userLabel}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 h-full w-[min(19rem,88vw)] shadow-lg">
            <Sidebar
              userLabel={userLabel}
              onOpenCommandPalette={() => {
                setMobileNavOpen(false);
                setPaletteOpen(true);
              }}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
          <Link href="/dashboard" className="flex items-center">
            <Logo size={28} />
          </Link>
          <button
            type="button"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm hover:bg-secondary"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
