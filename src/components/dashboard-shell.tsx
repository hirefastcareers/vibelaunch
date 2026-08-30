"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

interface DashboardShellProps {
  children: React.ReactNode;
  userLabel?: string;
}

export function DashboardShell({ children, userLabel }: DashboardShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden dark">
      <Sidebar
        userLabel={userLabel}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
