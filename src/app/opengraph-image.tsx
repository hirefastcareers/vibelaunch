import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Sorano - Autonomous Growth for Indie Builders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FAF8F4";
const INK = "#242424";
const MUTED = "#6B655C";
const ACCENT = "#F24100";
const HAIRLINE = "#E0DCD3";

const MONO_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@5.2.5/latin-400-normal.ttf";
const SERIF_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@5.2.5/latin-400-normal.ttf";

function Mark({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      style={{ display: "flex" }}
    >
      <path d="M159.4 159.4 A84 84 0 1 1 159.4 40.6" stroke={ACCENT} strokeWidth={26} />
      <path d="M132.53 132.53 A46 46 0 1 1 132.53 67.47" stroke={INK} strokeWidth={26} />
    </svg>
  );
}

export default async function Image() {
  const [mono, serif] = await Promise.all([
    fetch(MONO_FONT_URL).then((res) => (res.ok ? res.arrayBuffer() : null)).catch(() => null),
    fetch(SERIF_FONT_URL).then((res) => (res.ok ? res.arrayBuffer() : null)).catch(() => null),
  ]);

  const fonts: { name: string; data: ArrayBuffer; style: "normal"; weight: 400 }[] = [];
  if (mono) fonts.push({ name: "JetBrains Mono", data: mono, style: "normal", weight: 400 });
  if (serif) fonts.push({ name: "Instrument Serif", data: serif, style: "normal", weight: 400 });

  const monoFamily = mono ? "JetBrains Mono" : "monospace";
  const serifFamily = serif ? "Instrument Serif" : "serif";

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
          padding: "72px 80px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mark size={72} />
          <div
            style={{
              display: "flex",
              fontFamily: serifFamily,
              fontSize: 50,
              letterSpacing: "-0.03em",
              color: INK,
            }}
          >
            Sorano
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
            Autonomous growth for indie builders.
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: monoFamily,
              fontSize: 22,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            SEO · GEO · X
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined },
  );
}
