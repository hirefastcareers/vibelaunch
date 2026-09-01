"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  FileText,
  MessageSquare,
  Rocket,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/dashboard/queue", label: "AI Post Generator & Hooks", icon: Sparkles },
  { href: "/dashboard#articles", label: "Auto-Published Articles", icon: FileText },
  { href: "/dashboard#ai-search", label: "AI Search (ChatGPT/Perplexity)", icon: Bot },
  { href: "/dashboard/replies", label: "Smart Replies", icon: MessageSquare },
  { href: "/dashboard/diagnostics", label: "App Health & Audits", icon: ShieldCheck },
  { href: "/onboard", label: "Onboard Project", icon: Rocket },
];

interface SidebarProps {
  userLabel?: string;
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ userLabel, onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 px-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold tracking-tight">Sorano</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const itemPath = item.href.split("#")[0];
          const active = pathname === itemPath && !item.href.includes("#");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-3">
        <button
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <span>Quick actions</span>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        {userLabel && (
          <p className="truncate text-xs text-muted-foreground px-1">{userLabel}</p>
        )}
      </div>
    </aside>
  );
}
