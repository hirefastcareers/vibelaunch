"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Folder,
  HeartPulse,
  LayoutDashboard,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/queue", label: "Posts", icon: Send },
  { href: "/dashboard/replies", label: "Replies", icon: MessageCircle },
  { href: "/dashboard/diagnostics", label: "Health", icon: HeartPulse },
];

const accountItems = [
  { href: "/dashboard/projects", label: "Projects", icon: Folder },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

interface SidebarProps {
  userLabel?: string;
  onOpenCommandPalette?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ userLabel, onOpenCommandPalette, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="flex items-center" onClick={onNavigate}>
          <Logo size={26} />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        <NavGroup
          items={navItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavGroup
          title="Workspace"
          items={accountItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </span>
          <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        {userLabel ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {userLabel.replace(/^@/, "").slice(0, 1).toUpperCase()}
            </span>
            <p className="truncate text-sm text-foreground">{userLabel}</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: Array<{ href: string; label: string; icon: typeof LayoutDashboard }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {title ? (
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
      ) : null}
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/dashboard/projects"
            ? pathname.startsWith("/dashboard/projects")
            : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
