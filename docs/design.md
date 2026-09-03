# Sorano design language

Fonts stay as they are (`Instrument_Serif` + `JetBrains_Mono` in `layout.tsx`). Only the palette flips: light warm paper base, near-black ink, one orange accent. Keep `boxShadow: none`. Corner radius is rounded, not sharp — see the radius rule in section 2.

Dark sections are opt-in per section, not global. Do not put `class="dark"` on `<html>`.

## 1. Tokens

```css
@layer base {
  :root {
    --background: 40 27% 96%;        /* #FAF8F4 paper */
    --foreground: 36 9% 8%;          /* #171512 ink */
    --card: 40 22% 92%;              /* #F2EEE7 panel */
    --card-foreground: 36 9% 8%;
    --popover: 40 27% 96%;
    --popover-foreground: 36 9% 8%;
    --primary: 20 100% 50%;          /* #FF5500 */
    --primary-foreground: 0 0% 100%;
    --secondary: 40 22% 92%;
    --secondary-foreground: 36 9% 8%;
    --muted: 40 22% 92%;
    --muted-foreground: 33 6% 42%;   /* #6B655C */
    --accent: 20 100% 44%;           /* #E14A00 hover */
    --accent-foreground: 0 0% 100%;
    --destructive: 20 100% 44%;
    --destructive-foreground: 0 0% 100%;
    --border: 36 16% 85%;            /* #E0DCD3 hairline */
    --input: 36 16% 85%;
    --ring: 20 100% 50%;
    --radius: 0.5rem;

    --ink: 36 9% 8%;                 /* #171512 section bg */
    --ink-panel: 33 10% 10%;         /* #1E1B17 panel inside dark band */
    --ink-rule: 33 9% 15%;           /* #2C2822 hairline inside dark band */
    --ink-dim: 36 8% 64%;            /* #A8A199 body text on dark */
  }
}
```

## 2. Rules of the system

- **Rounded, not sharp.** Cards, panels, and modals use 16–20px radius (`rounded-lg` / `rounded-xl`). Inputs and form controls use 8–12px (`rounded-sm` / `rounded-md`). Buttons, badges, and status pills use full rounding (`rounded-full`). This replaced the earlier sharp-corner (2px) system. Adopted from an external SaaS-style reference, but scoped to radius and type-scale confidence ONLY — the reference's custom fonts (AeonikPro/DotConnect), second accent color (a blue), and 3D-render imagery were explicitly NOT adopted. Sorano keeps its serif+mono typography, single-accent-orange discipline, and photography-free/render-free visual language.
- **Cards are legitimate.** This supersedes the earlier "hairlines, not cards" rule. Hairline dividers (`border-b border-border`, `gap-px bg-border` grids) are still the right way to separate rows and KPI cells, but rounded cards/panels are an embraced component — not something to avoid. No shadows, no glow.
- **Two container columns.** Every section body is `grid grid-cols-[260px_1fr] gap-12` (homepage mock uses `280px` / `max-w-[1200px]`). Left column is a monospace section index (`01 - THE LOOP`), right column is the content. Container is `max-w-[1120px] px-8` (homepage mock: `max-w-[1200px] px-8`).
- **Type roles.** Serif = headlines and any single-line label that carries meaning (`text-[42px] leading-[1.08] tracking-[-0.02em]`). Mono = eyebrows, metadata, statuses, nav, buttons, footer (`text-[10px] tracking-[0.14em] uppercase`). Sans = body copy only.
- **Accent budget.** Orange only on: the primary CTA, section index numbers, live/status markers. Never as a background wash, never as a gradient.
- **Backgrounds.** Exactly three: paper `bg-background`, panel `bg-card`, ink `bg-ink`. Alternate paper/panel down the page; use ink at most twice.
- **Numbers as structure.** Sections are numbered `01`-`05`; list items get `OUTPUT_01`, `MODULE 02`. This carries the "engine" feeling without terminal cosplay.
- **Data rows over feature cards.** Comparable facts go in a bordered table-style row list (`grid-cols-[200px_1fr_120px]`), not in a 3-up card grid.
- **Buttons.** `bg-primary text-white font-mono text-xs tracking-[0.1em] px-6 py-4 rounded-full hover:bg-accent`. Secondary is a text link with `border-b border-border`, or an outline pill (`rounded-full border border-border`).
- **Responsive.** Write mobile-first. At `lg:` the `[280px_1fr]` section shell and the hero become two columns, 4-up grids go 4-up (2-up at `md:`), and `h1`/`h2` step up. At the mobile default, everything is single-column, container padding is 20px, and `h1`/`h2`/`h3` step to 37/27/21px.
- **Muted text floor.** `#8C857A` is the lightest tone allowed on paper, and only for decorative indices. Anything information-carrying (timestamps, frequencies, metadata) uses `#6B655C` or darker. `#A8A199` (`ink-dim`) is for dark bands only.
- **Image placeholders.** Diagonal 6px stripe fill + a mono caption naming what belongs there. Replace with real screenshots before launch. No illustrated abstractions.

### Brackets are reserved for live status

Brackets (`[OK]`, `[WARN]`, `[SYS_OK]`, `[PREVIEW]`, and the rest) are reserved for live status: `StatusPill` indicators. Never wrap section labels or page eyebrows in brackets. Those use plain mono-uppercase-tracked text instead (`OPS`, `AI SEARCH`, `01 - THE PLATFORM`) — the same convention as the landing page.

## 3. Banned (the slop list)

Gradient hero backgrounds, glassmorphism, glowing orbs or blurred blobs, emoji bullets, purple/violet, floating 3D mockups, `shadow-2xl` cards, animated gradient text, "Trusted by 10,000+" with no logos, invented metrics, icon-per-feature grids, `rounded-2xl` everything, marquee logo strips.

## Data visualization components

Pass 1 of the visual overhaul. These live in `src/components/ui/` and `src/components/dashboard/` and are not wired into pages yet. Grounded in Peec / Ahrefs / Semrush layout patterns, but the palette does not expand: primary orange (`#FF5500` family) is the only accent; ink / ink-muted / surface-muted / muted-foreground do everything else. No new colors, no gradients, no rainbow multi-series charts, no red/green semantic colors, no drop shadows.

**Trend direction.** The landing page already set the rule: `<span className="font-mono text-[11px] text-accent">▲ +14 PTS</span>`. Positive movement is accent orange + up arrow. Negative and zero stay `text-muted-foreground` (down arrow only when negative). Do not introduce red for declines.

**Multi-series charts.** Featured / "this project" series: `--primary`, solid. Comparison series: `--ink`, `--ink-muted`, `--surface-muted` in that order. If more than two comparison series need distinguishing, add dash patterns (`6 4`, then `2 3`) — do not add a fourth hue. Grid, axis text, and tooltip chrome use `--border`, `--muted-foreground`, `--background` / `--card` only. Never leave Recharts default blues/greens in place.

### TrendBadge — `src/components/ui/trend-badge.tsx`

Use next to a metric whenever you need period-over-period movement. Same type as the landing hero: `font-mono text-[11px]`.

```
value > 0   →  text-accent            "▲ +14%"
value < 0   →  text-muted-foreground  "▼ -3%"
value === 0 →  text-muted-foreground  "0%"
```

Props: `{ value: number; suffix?: string }` (`suffix` defaults to `"%"`; pass `" PTS"` to match the landing precedent).

### StatCard — `src/components/dashboard/stat-card.tsx`

Compact overview metric (Semrush Overview panel). Hairline box matching `Card`: `rounded-lg border border-border bg-card px-6 py-7 shadow-none`. Label is `ds-label` (mono uppercase muted). Value is a serif number at `text-[40px]` (`text-[32px]` below `sm` so large figures don't overflow a stacked KPI cell). Optional `TrendBadge` sits on the baseline; optional sparkline is a 44px Recharts line with no axes, labels, or tooltip — shape only, stroked in `--primary`. In a KPI row, drop the individual card border and sit the cards in a `gap-px bg-border` hairline grid so the padding — not a 1px gap — is what gives them air.

Props: `{ label: string; value: string | number; trend?: number; sparkline?: number[] }`

### TrendChart — `src/components/dashboard/trend-chart.tsx`

Client-only multi-series line chart (Ahrefs Brand Radar). Custom legend toggles series via Recharts v3 `Line.hide` (hidden series stay in the legend). Hover tooltip shows exact values. Click legend items to show/hide.

Props: `{ data: Array<Record<string, number | string>>; series: Array<{ key: string; label: string; featured?: boolean }>; xKey: string }`

- `featured: true` → `--primary`, solid, slightly heavier stroke.
- Other series → ink / ink-muted / surface-muted; dash only when there are more than two non-featured series.
- Tooltip: `bg-card border-border`, no shadow. Axis ticks: mono 11px `--muted-foreground`. Grid: `--border` hairlines, horizontal only.

### DataPill — `src/components/ui/data-pill.tsx`

Categorical / type tags in tables (Peec "UGC" / "Editorial"). Does not replace `StatusPill` — that stays for operational status (`ok` / `warn` / `fail` / `neutral`). Same shell as StatusPill (`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider`). Categories are distinguished by fill vs outline, not by extra hues. Pass `tone`, never ad-hoc color classes at the call site.

```
tone="filled"  →  ink-muted fill, paper text
tone="soft"    →  surface-muted fill, ink text
tone="outline" →  border-only, muted text   (default)
```

Props: `{ children: ReactNode; tone?: "filled" | "soft" | "outline" }`

### IconFeatureCard — `src/components/ui/icon-feature-card.tsx`

Small icon + serif label + muted description in a hairline box (Peec feature card, adapted). Icon is lucide-react, ink-colored, 16px — not orange. Padding/radius match `Card` (`p-4`, `rounded-lg`). Do not use this as a 3-up marketing grid on the homepage; that remains banned. Fine inside product UI where a short capability needs a name and a sentence.

Props: `{ icon: LucideIcon; label: string; description: string }`

### SegmentedTabs — `src/components/ui/segmented-tabs.tsx`

Single-select control for switching data views ("Mentions / Impressions", provider filters). Pill-style grouping at the control radius: `rounded-sm` (8px) on the track, not `rounded-full`. Active segment is `bg-ink text-background` (not orange — orange stays on CTAs and live/trend markers). Labels are mono 11px uppercase.

Props: `{ options: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }`
