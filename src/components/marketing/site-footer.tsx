import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    head: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Fix it loop", href: "/#fix-it" },
      { label: "Pricing", href: "/pricing" },
      { label: "Get Started Free", href: "/auth/signin" },
    ],
  },
  {
    head: "App",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sign in", href: "/auth/signin" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
];

export function MarketingSiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="ds-container grid grid-cols-1 gap-10 pb-10 pt-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo size={28} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            AI citation tracking that closes the loop with content fixes — for indie hackers and
            SaaS builders.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.head}>
            <p className="ds-label">{col.head}</p>
            <ul className="mt-4 space-y-2">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="ds-container flex flex-wrap justify-between gap-4 border-t border-border pb-10 pt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span>© {new Date().getFullYear()} Xoopa</span>
        <Link href="/" className="hover:text-foreground">
          xoopa.app
        </Link>
      </div>
    </footer>
  );
}
