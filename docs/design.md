# Sorano design language

Fonts stay as they are (`Instrument_Serif` + `JetBrains_Mono` in `layout.tsx`). Only the palette flips: light warm paper base, near-black ink, one orange accent. Keep `borderRadius: 2px` and `boxShadow: none` from the current Tailwind config.

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
    --radius: 0.125rem;

    --ink: 36 9% 8%;                 /* #171512 section bg */
    --ink-panel: 33 10% 10%;         /* #1E1B17 panel inside dark band */
    --ink-rule: 33 9% 15%;           /* #2C2822 hairline inside dark band */
    --ink-dim: 36 8% 64%;            /* #A8A199 body text on dark */
  }
}
```

## 2. Rules of the system

- **Hairlines, not cards.** Sections separate with `border-b border-border`. Grids are `gap-px bg-border` with `bg-background` children. No shadows, no rounded cards, no glow.
- **Two container columns.** Every section body is `grid grid-cols-[260px_1fr] gap-12` (homepage mock uses `280px` / `max-w-[1200px]`). Left column is a monospace section index (`01 - THE LOOP`), right column is the content. Container is `max-w-[1120px] px-8` (homepage mock: `max-w-[1200px] px-8`).
- **Type roles.** Serif = headlines and any single-line label that carries meaning (`text-[42px] leading-[1.08] tracking-[-0.02em]`). Mono = eyebrows, metadata, statuses, nav, buttons, footer (`text-[10px] tracking-[0.14em] uppercase`). Sans = body copy only.
- **Accent budget.** Orange only on: the primary CTA, section index numbers, live/status markers. Never as a background wash, never as a gradient.
- **Backgrounds.** Exactly three: paper `bg-background`, panel `bg-card`, ink `bg-ink`. Alternate paper/panel down the page; use ink at most twice.
- **Numbers as structure.** Sections are numbered `01`-`05`; list items get `OUTPUT_01`, `MODULE 02`. This carries the "engine" feeling without terminal cosplay.
- **Data rows over feature cards.** Comparable facts go in a bordered table-style row list (`grid-cols-[200px_1fr_120px]`), not in a 3-up card grid.
- **Buttons.** `bg-primary text-white font-mono text-xs tracking-[0.1em] px-6 py-4 rounded-sm hover:bg-accent`. Secondary is a text link with `border-b border-border`.
- **Responsive.** Write mobile-first. At `lg:` the `[280px_1fr]` section shell and the hero become two columns, 4-up grids go 4-up (2-up at `md:`), and `h1`/`h2` step up. At the mobile default, everything is single-column, container padding is 20px, and `h1`/`h2`/`h3` step to 37/27/21px.
- **Muted text floor.** `#8C857A` is the lightest tone allowed on paper, and only for decorative indices. Anything information-carrying (timestamps, frequencies, metadata) uses `#6B655C` or darker. `#A8A199` (`ink-dim`) is for dark bands only.
- **Image placeholders.** Diagonal 6px stripe fill + a mono caption naming what belongs there. Replace with real screenshots before launch. No illustrated abstractions.

## 3. Banned (the slop list)

Gradient hero backgrounds, glassmorphism, glowing orbs or blurred blobs, emoji bullets, purple/violet, floating 3D mockups, `shadow-2xl` cards, animated gradient text, "Trusted by 10,000+" with no logos, invented metrics, icon-per-feature grids, `rounded-2xl` everything, marquee logo strips.
