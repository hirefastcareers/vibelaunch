"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Command Center", key: "01" },
  { href: "/dashboard/queue", label: "AI Post Generator & Hooks", key: "02" },
  { href: "/dashboard#articles", label: "Auto-Published Articles", key: "03" },
  { href: "/dashboard#ai-search", label: "AI Search (ChatGPT/Perplexity)", key: "04" },
  { href: "/dashboard/replies", label: "Smart Replies", key: "05" },
  { href: "/dashboard/diagnostics", label: "App Health & Audits", key: "06" },
  { href: "/onboard", label: "Onboard Project", key: "07" },
  { href: "/dashboard/billing", label: "Billing", key: "08" },
];

interface SidebarProps {
  userLabel?: string;
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ userLabel, onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="flex items-center">
          <Logo size={28} />
        </Link>
      </div>

      <Separator />

      <nav className="flex-1 space-y-0 p-2">
        {navItems.map((item) => {
          const itemPath = item.href.split("#")[0];
          const active = pathname === itemPath && !item.href.includes("#");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-baseline gap-2 rounded-sm border-l-2 border-transparent px-2 py-2 text-sm transition-colors",
                active
                  ? "border-l-2 border-primary bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className={cn("font-mono text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
                {item.key}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-3 border-t border-border">
        <button
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-full border border-border bg-transparent px-4 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <span className="font-mono text-[10px] tracking-wider">QUICK ACTIONS</span>
          <kbd className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        {userLabel && (
          <p className="truncate font-mono text-[10px] text-muted-foreground px-1">{userLabel}</p>
        )}
      </div>
    </aside>
  );
}
