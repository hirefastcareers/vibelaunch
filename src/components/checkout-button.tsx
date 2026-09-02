"use client";

import { useState } from "react";

export function CheckoutButton({
  href,
  children,
  primary = true,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(href);
      const data = (await res.json()) as { checkout_url?: string; error?: string };
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setError(data.error || "Checkout could not be started");
    } catch {
      setError("Checkout could not be started");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <a
        href={href}
        onClick={onClick}
        className={
          primary
            ? "ds-btn text-center"
            : "rounded-sm border border-border px-6 py-[15px] text-center font-mono text-xs tracking-[0.1em] text-muted-foreground hover:border-foreground"
        }
      >
        {pending ? "REDIRECTING..." : children}
      </a>
      {error ? (
        <span className="font-mono text-[11px] text-muted-foreground">{error}</span>
      ) : null}
    </span>
  );
}
