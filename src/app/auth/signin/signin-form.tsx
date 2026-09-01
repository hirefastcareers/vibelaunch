"use client";

import { signIn } from "next-auth/react";

interface SignInFormProps {
  demoMode?: boolean;
}

export default function SignInForm({ demoMode = false }: SignInFormProps) {
  return (
    <main className="min-h-screen flex items-center px-6">
      <div className="bg-card p-8 rounded-sm border border-stone-800 shadow-none max-w-md w-full">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
          [AUTH]
        </p>
        <h1 className="text-3xl mb-3">Autonomous Growth for Indie Builders</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          {demoMode
            ? "Preview mode - click Demo Login to explore the full dashboard."
            : "Turn your product updates into viral social posts, Google-ranked articles, and AI search recommendations - automatically."}
        </p>

        {demoMode && (
          <button
            onClick={() =>
              signIn("demo", {
                username: "demo",
                password: "demo",
                callbackUrl: "/dashboard",
              })
            }
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 font-mono text-sm tracking-wider mb-3"
          >
            DEMO LOGIN
          </button>
        )}

        <button
          onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
          disabled={demoMode}
          className="w-full px-6 py-3 border border-stone-800 text-foreground rounded-sm hover:bg-accent font-mono text-sm tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
        >
          SIGN IN WITH X
        </button>

        {demoMode && (
          <p className="mt-4 font-mono text-[10px] text-muted-foreground">
            [PREVIEW] No database or API keys required
          </p>
        )}
      </div>
    </main>
  );
}
