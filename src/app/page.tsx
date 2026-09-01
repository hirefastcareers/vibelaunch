import Link from "next/link";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const demo = isDemoMode();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {demo && (
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 text-center text-sm text-primary">
          Preview mode active -{" "}
          <Link href="/auth/signin" className="underline font-medium">
            Demo Login
          </Link>{" "}
          to explore the full dashboard
        </div>
      )}

      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">Sorano</span>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <span className="text-sm text-muted-foreground">
                  {session.user.xUsername ? `@${session.user.xUsername}` : session.user.name}
                </span>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                {demo ? "Demo Login" : "Sign in with X"}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">Autonomous Growth for Indie Builders</h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Turn your product updates into viral social posts, Google-ranked articles,
          and AI search recommendations - automatically.
        </p>
        <Link
          href={session ? "/dashboard" : "/auth/signin"}
          className="inline-block px-8 py-3 bg-primary text-primary-foreground text-lg font-medium rounded-lg hover:bg-primary/90"
        >
          {session ? "Go to Dashboard" : demo ? "Try Demo Dashboard" : "Get Started"}
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-8">
        {[
          { phase: "Posts", title: "AI Post Generator & Hooks", desc: "Turn product updates into viral social posts that learn from what already worked." },
          { phase: "Articles", title: "Auto-Published Articles", desc: "Ship Google-ranked articles from the same updates - without a separate content workflow." },
          { phase: "AI Search", title: "AI Search (ChatGPT/Perplexity)", desc: "Get recommended in ChatGPT and Perplexity when people ask for tools like yours." },
          { phase: "Health", title: "App Health & Audits", desc: "See indexing, media, and AI-search citation checks in one place." },
        ].map((f) => (
          <div key={f.phase} className="bg-card p-6 rounded-xl border border-border">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">{f.phase}</span>
            <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
