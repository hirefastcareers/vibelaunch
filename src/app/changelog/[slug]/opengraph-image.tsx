import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Changelog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FAF8F4";
const INK = "#171512";
const HAIRLINE = "#E0DCD3";
const MUTED = "#6B655C";
const PRIMARY = "#FF5500";

const MONO_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@5.2.5/latin-400-normal.ttf";
const SERIF_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@5.2.5/latin-400-normal.ttf";

let fontsPromise: Promise<
  | { name: string; data: ArrayBuffer; style: "normal"; weight: 400 }[]
  | undefined
> | null = null;

async function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(MONO_FONT_URL).then((res) => (res.ok ? res.arrayBuffer() : null)),
      fetch(SERIF_FONT_URL).then((res) => (res.ok ? res.arrayBuffer() : null)),
    ])
      .then(([mono, serif]) => {
        const fonts: { name: string; data: ArrayBuffer; style: "normal"; weight: 400 }[] = [];
        if (mono) fonts.push({ name: "JetBrains Mono", data: mono, style: "normal", weight: 400 });
        if (serif) fonts.push({ name: "Instrument Serif", data: serif, style: "normal", weight: 400 });
        return fonts.length > 0 ? fonts : undefined;
      })
      .catch(() => undefined);
  }
  return fontsPromise;
}

function clamp(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function FallbackCard({
  monoFamily,
  serifFamily,
}: {
  monoFamily: string;
  serifFamily: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        border: `1px solid ${HAIRLINE}`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: serifFamily,
          fontSize: 72,
          lineHeight: 1.08,
          letterSpacing: -1.4,
          color: INK,
        }}
      >
        Sorano
      </div>
      <div
        style={{
          display: "flex",
          width: 40,
          height: 2,
          backgroundColor: PRIMARY,
          marginTop: 16,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          display: "flex",
          fontFamily: monoFamily,
          fontSize: 18,
          letterSpacing: 2.8,
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        Changelog
      </div>
    </div>
  );
}

function EntryCard({
  projectName,
  title,
  summary,
  monoFamily,
  serifFamily,
}: {
  projectName: string;
  title: string;
  summary: string;
  monoFamily: string;
  serifFamily: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        border: `1px solid ${HAIRLINE}`,
        padding: "64px 72px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: monoFamily,
              fontSize: 18,
              letterSpacing: 2.8,
              textTransform: "uppercase",
              color: INK,
            }}
          >
            {clamp(projectName, 40)}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: monoFamily,
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: PRIMARY,
            }}
          >
            Changelog
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 40,
            height: 2,
            backgroundColor: PRIMARY,
            marginTop: 12,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          fontFamily: serifFamily,
          fontSize: 64,
          lineHeight: 1.08,
          letterSpacing: -1.2,
          color: INK,
        }}
      >
        {clamp(title, 90)}
      </div>

      {summary ? (
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontFamily: "sans-serif",
            fontSize: 22,
            lineHeight: 1.45,
            color: MUTED,
          }}
        >
          {clamp(summary, 180)}
        </div>
      ) : null}
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [fonts, entry] = await Promise.all([
    loadFonts(),
    prisma.changelogEntry.findUnique({
      where: { slug, published: true },
      include: { project: { select: { name: true } } },
    }),
  ]);

  const hasMono = fonts?.some((f) => f.name === "JetBrains Mono") ?? false;
  const hasSerif = fonts?.some((f) => f.name === "Instrument Serif") ?? false;
  const monoFamily = hasMono ? "JetBrains Mono" : "monospace";
  const serifFamily = hasSerif ? "Instrument Serif" : "serif";

  const element = entry
    ? (
        <EntryCard
          projectName={entry.project.name}
          title={entry.title}
          summary={entry.summary}
          monoFamily={monoFamily}
          serifFamily={serifFamily}
        />
      )
    : (
        <FallbackCard monoFamily={monoFamily} serifFamily={serifFamily} />
      );

  return new ImageResponse(element, {
    ...size,
    fonts,
  });
}
