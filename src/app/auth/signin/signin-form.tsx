"use client";

import { signIn } from "next-auth/react";

interface SignInFormProps {
  demoMode?: boolean;
}

export default function SignInForm({ demoMode = false }: SignInFormProps) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-xl border border-border shadow-sm max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to VibeLaunch</h1>
        <p className="text-muted-foreground mb-8">
          {demoMode
            ? "Preview mode — click Demo Login to explore the full dashboard."
            : "Connect your X account to start launching."}
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
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium mb-3"
          >
            Demo Login
          </button>
        )}

        <button
          onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
          disabled={demoMode}
          className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sign in with X
        </button>

        {demoMode && (
          <p className="mt-4 text-xs text-muted-foreground">
            Demo mode — no database or API keys required
          </p>
        )}
      </div>
    </main>
  );
}
