"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

interface DashboardShellProps {
  children: React.ReactNode;
  userLabel?: string;
  demoMode?: boolean;
}

export function DashboardShell({ children, userLabel, demoMode }: DashboardShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden dark">
      <Sidebar
        userLabel={userLabel}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {demoMode && (
          <div className="border-b border-stone-800 px-6 py-2 font-mono text-[11px] text-muted-foreground">
            [PREVIEW] Demo data shown. Connect a database and API keys for live features.
          </div>
        )}
        {children}
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
