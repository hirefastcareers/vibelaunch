import { ImageResponse } from "next/og";
import { put } from "@vercel/blob";
import {
  CODE_CARD_HEIGHT,
  CODE_CARD_WIDTH,
  codeCardBlobPath,
  visibleCodeLines,
} from "@/lib/media/code-card-layout";

const PAPER = "#FAF8F4";
const INK = "#171512";
const HAIRLINE = "#E0DCD3";
const MUTED = "#6B655C";
const PRIMARY = "#FF5500";

const MONO_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@5.2.5/latin-400-normal.ttf";

let monoFontPromise: Promise<ArrayBuffer | null> | null = null;

async function loadMonoFont(): Promise<ArrayBuffer | null> {
  if (!monoFontPromise) {
    monoFontPromise = fetch(MONO_FONT_URL)
      .then(async (res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
  }
  return monoFontPromise;
}

export interface CodeCardOptions {
  code: string;
  language?: string;
  title?: string;
  theme?: "dark" | "light";
}

export interface CodeCardResult {
  imageUrl: string;
  width: number;
  height: number;
}

export async function renderCodeCard(options: CodeCardOptions): Promise<CodeCardResult> {
  const language = options.language?.trim() || "code";
  const heading = options.title?.trim() || language;
  const { lines, truncated } = visibleCodeLines(options.code);
  const pathname = codeCardBlobPath(options);

  const fontData = await loadMonoFont();
  const fonts = fontData
    ? [{ name: "JetBrains Mono", data: fontData, style: "normal" as const, weight: 400 as const }]
    : undefined;

  const image = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: PAPER,
          border: `1px solid ${HAIRLINE}`,
          padding: "48px 56px",
          fontFamily: fontData ? "JetBrains Mono" : "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                letterSpacing: 2.8,
                textTransform: "uppercase",
                color: INK,
              }}
            >
              {heading}
            </div>
            {options.title?.trim() ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: PRIMARY,
                }}
              >
                {language}
              </div>
            ) : null}
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
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "row",
                height: 22,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 48,
                  marginRight: 20,
                  fontSize: 16,
                  color: MUTED,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  fontSize: 16,
                  color: INK,
                  whiteSpace: "pre",
                }}
              >
                {line.length > 0 ? line : " "}
              </div>
            </div>
          ))}
          {truncated ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: 22,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 48,
                  marginRight: 20,
                  fontSize: 16,
                  color: MUTED,
                }}
              >
                {" "}
              </div>
              <div style={{ display: "flex", fontSize: 16, color: MUTED }}>…</div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: CODE_CARD_WIDTH,
      height: CODE_CARD_HEIGHT,
      fonts,
    }
  );

  const png = Buffer.from(await image.arrayBuffer());
  const blob = await put(pathname, png, {
    access: "public",
    contentType: "image/png",
    allowOverwrite: true,
  });

  return {
    imageUrl: blob.url,
    width: CODE_CARD_WIDTH,
    height: CODE_CARD_HEIGHT,
  };
}
