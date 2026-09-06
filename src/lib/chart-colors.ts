/**
 * Concrete HSL strings for SVG charts.
 * Recharts/d3 cannot parse CSS variables such as hsl(var(--primary)),
 * and interpolating those values throws during animation.
 */
export const CHART_COLOR = {
  primary: "hsl(16, 100%, 50%)",
  info: "hsl(217, 91%, 60%)",
  chart4: "hsl(215, 16%, 47%)",
  ink: "hsl(222, 47%, 11%)",
  inkMuted: "hsl(220, 16%, 30%)",
  surfaceMuted: "hsl(215, 14%, 77%)",
  border: "hsl(214, 20%, 90%)",
  mutedFg: "hsl(215, 16%, 47%)",
} as const;
