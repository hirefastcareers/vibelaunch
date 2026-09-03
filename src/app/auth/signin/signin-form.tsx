"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/logo";

export default function SignInForm() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute inset-x-0 top-[-8rem] h-[24rem] bg-[radial-gradient(circle_at_top,rgba(242,65,0,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1120px] flex-col justify-center px-5 py-16 md:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <Link href="/" className="mb-8 inline-flex">
              <Logo size={40} />
            </Link>
            <p className="ds-label mb-4">AUTH</p>
            <h1 className="mb-4 max-w-[14ch] text-[40px] leading-[1.02] md:text-[56px]">
              Sign in. Ship once. Get found everywhere.
            </h1>
            <p className="max-w-[42ch] text-pretty text-[17px] leading-[1.7] text-muted-foreground">
              Connect X once. Sorano turns your product updates into posts, articles,
              and AI search citations automatically.
            </p>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-8 shadow-lg">
            <p className="ds-label mb-3">START</p>
            <h2 className="mb-2 text-[28px] leading-tight">Continue with X</h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              One login. No API keys to paste, no second CMS, no scheduling tool on the side.
            </p>

            <button
              type="button"
              onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
              className="w-full rounded-xl bg-primary px-6 py-4 font-mono text-xs tracking-[0.1em] text-primary-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md"
            >
              SIGN IN WITH X
            </button>

            <p className="mt-5 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
              You will return to your dashboard after authorizing Sorano.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
