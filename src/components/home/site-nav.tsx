"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#visibility", label: "AI Visibility" },
  { href: "#rankings", label: "Rankings" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteNav({
  signedIn,
  navCta,
  userLabel,
}: {
  signedIn: boolean;
  navCta: string;
  userLabel?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ctaHref = signedIn ? "/dashboard" : "/auth/signin";

  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="ds-container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            SEO · GEO · X
          </span>
        </Link>

        <div className="hidden items-center gap-6 text-[12px] font-medium tracking-[0.02em] md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link href={ctaHref} className="ds-btn-ink">
            {navCta}
          </Link>
          {signedIn && userLabel ? (
            <span className="hidden text-muted-foreground lg:inline">{userLabel}</span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background shadow-sm md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <Link href={ctaHref} className="ds-btn mt-2 text-center" onClick={() => setOpen(false)}>
              {navCta}
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
