"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Command Center", key: "01" },
  { href: "/dashboard/queue", label: "AI Post Generator", key: "02" },
  { href: "/dashboard#articles", label: "Published Articles", key: "03" },
  { href: "/dashboard#ai-search", label: "AI Search", key: "04" },
  { href: "/dashboard/replies", label: "Smart Replies", key: "05" },
  { href: "/dashboard/diagnostics", label: "App Health", key: "06" },
  { href: "/onboard", label: "Onboard Project", key: "07" },
  { href: "/dashboard/billing", label: "Billing", key: "08" },
];

interface SidebarProps {
  userLabel?: string;
  onOpenCommandPalette?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ userLabel, onOpenCommandPalette, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-gradient-to-b from-card to-background">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" className="flex items-center" onClick={onNavigate}>
          <Logo size={28} />
        </Link>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const itemPath = item.href.split("#")[0];
          const active = pathname === itemPath && !item.href.includes("#");
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-transparent px-3.5 py-3 text-sm transition-all",
                active
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-1.5 font-mono text-[10px] tracking-wider",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.key}
              </span>
              <span className="leading-snug">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground shadow-sm transition-all hover:bg-secondary hover:text-foreground hover:shadow-md"
        >
          <span className="font-mono text-[10px] tracking-wider">QUICK ACTIONS</span>
          <kbd className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        {userLabel && (
          <p className="truncate px-1 font-mono text-[10px] tracking-wider text-muted-foreground">
            {userLabel}
          </p>
        )}
      </div>
    </aside>
  );
}
