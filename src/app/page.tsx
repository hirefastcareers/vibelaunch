import Link from "next/link";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="min-h-screen">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">VibeLaunch</span>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <span className="text-sm text-gray-500">
                  {session.user.xUsername ? `@${session.user.xUsername}` : session.user.name}
                </span>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Sign in with X
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Launch on X. Grow with SEO.
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          VibeLaunch helps founders schedule X posts, track engagement with ERI
          analytics, generate adaptive content, and publish SEO changelogs — all
          in one platform.
        </p>
        <Link
          href={session ? "/dashboard" : "/auth/signin"}
          className="inline-block px-8 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700"
        >
          {session ? "Go to Dashboard" : "Get Started"}
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-8">
        {[
          {
            phase: "Phase 1",
            title: "Projects & X OAuth",
            desc: "Connect your X account and manage launch projects with Prisma + pgvector.",
          },
          {
            phase: "Phase 2",
            title: "Media & Publishing",
            desc: "Process media, queue posts with QStash, and publish directly to X.",
          },
          {
            phase: "Phase 3",
            title: "ERI Analytics",
            desc: "Track engagement rate index, reinforce vectors, and generate adaptive content.",
          },
          {
            phase: "Phase 4",
            title: "SEO Changelog",
            desc: "Expand content for SEO, publish changelogs, sitemap, and Google indexing.",
          },
        ].map((f) => (
          <div key={f.phase} className="bg-white p-6 rounded-xl border border-gray-200">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              {f.phase}
            </span>
            <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
