import { ImageResponse } from "next/og";
import { getLogoMarkGeometry } from "@/components/logo";
import { getPublicScorecardBySlug } from "@/lib/geo/scorecard";

export const runtime = "nodejs";
export const alt = "Xoopa AI visibility scorecard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAPER = "#FAF8F4";
const INK = "#242424";
const MUTED = "#6B655C";
const ACCENT = "#F24100";
const HAIRLINE = "#E0DCD3";

const MONO_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@5.2.5/latin-400-normal.ttf";
const SERIF_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@5.2.5/latin-400-normal.ttf";

function Mark({ size = 64 }: { size?: number }) {
  const { strokeWidth, arms } = getLogoMarkGeometry(false);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      style={{ display: "flex" }}
    >
      {arms.map((arm) => (
        <path
          key={arm.d}
          d={arm.d}
          stroke={arm.tone === "accent" ? ACCENT : INK}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

type ImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const card = await getPublicScorecardBySlug(slug);

  const [mono, serif] = await Promise.all([
    fetch(MONO_FONT_URL)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null),
    fetch(SERIF_FONT_URL)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null),
  ]);

  const fonts: { name: string; data: ArrayBuffer; style: "normal"; weight: 400 }[] =
    [];
  if (mono) fonts.push({ name: "JetBrains Mono", data: mono, style: "normal", weight: 400 });
  if (serif)
    fonts.push({ name: "Instrument Serif", data: serif, style: "normal", weight: 400 });

  const monoFamily = mono ? "JetBrains Mono" : "monospace";
  const serifFamily = serif ? "Instrument Serif" : "serif";

  const brandName = card?.brandName ?? "Scorecard unavailable";
  const scoreText =
    card?.score != null ? String(card.score) : card ? "n/a" : "404";
  const subtitle =
    card?.score != null
      ? "AI visibility score (0–100)"
      : card
        ? "Not enough citation runs for a score yet"
        : "This scorecard is not public";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: PAPER,
          border: `1px solid ${HAIRLINE}`,
          padding: "64px 72px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mark size={56} />
          <div
            style={{
              display: "flex",
              fontFamily: serifFamily,
              fontSize: 40,
              letterSpacing: "-0.03em",
              color: INK,
            }}
          >
            Xoopa
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontFamily: monoFamily,
              fontSize: 18,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            AI visibility scorecard
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: serifFamily,
              fontSize: 52,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: INK,
              maxWidth: 900,
            }}
          >
            {brandName}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div
              style={{
                display: "flex",
                fontFamily: serifFamily,
                fontSize: 96,
                lineHeight: 1,
                color: ACCENT,
              }}
            >
              {scoreText}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: monoFamily,
                fontSize: 22,
                color: MUTED,
                maxWidth: 480,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined }
  );
}
