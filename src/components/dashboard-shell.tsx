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
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 text-center text-sm text-primary">
            Preview mode — demo data shown. Connect a database and API keys for live features.
          </div>
        )}
        {children}
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
