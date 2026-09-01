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
        <div className="border-b border-stone-800 px-6 py-2 font-mono text-[11px] text-muted-foreground">
          [PREVIEW]{" "}
          <Link href="/auth/signin" className="underline text-foreground">
            Demo Login
          </Link>{" "}
          to explore the full dashboard
        </div>
      )}

      <nav className="border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-serif text-xl">Sorano</span>
          <div className="flex items-center gap-4 font-mono text-[11px] tracking-wider">
            {session ? (
              <>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  DASHBOARD
                </Link>
                <span className="text-muted-foreground">
                  {session.user.xUsername ? `@${session.user.xUsername}` : session.user.name}
                </span>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90"
              >
                {demo ? "DEMO LOGIN" : "SIGN IN WITH X"}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4">
          [GROWTH_ENGINE]
        </p>
        <h1 className="text-5xl md:text-6xl max-w-3xl mb-6">
          Autonomous Growth for Indie Builders
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl">
          Turn your product updates into viral social posts, Google-ranked articles,
          and AI search recommendations - automatically.
        </p>
        <Link
          href={session ? "/dashboard" : "/auth/signin"}
          className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm font-mono tracking-wider rounded-sm hover:bg-primary/90"
        >
          {session ? "GO TO DASHBOARD" : demo ? "TRY DEMO DASHBOARD" : "GET STARTED"}
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-px bg-stone-800 border border-stone-800">
        {[
          { key: "01", title: "AI Post Generator & Hooks", desc: "Turn product updates into viral social posts that learn from what already worked." },
          { key: "02", title: "Auto-Published Articles", desc: "Ship Google-ranked articles from the same updates, without a separate content workflow." },
          { key: "03", title: "AI Search (ChatGPT/Perplexity)", desc: "Get recommended in ChatGPT and Perplexity when people ask for tools like yours." },
          { key: "04", title: "App Health & Audits", desc: "See indexing, media, and AI-search citation checks in one place." },
        ].map((f) => (
          <div key={f.key} className="bg-background p-6">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{f.key}</span>
            <h3 className="mt-2 text-xl">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
