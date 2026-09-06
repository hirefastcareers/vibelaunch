type LogoProps = {
  /** Height of the mark in px. Wordmark scales with it. */
  size?: number;
  /** Show the "Xoopa" wordmark next to the mark. */
  wordmark?: boolean;
  /** Text to render as the wordmark. */
  label?: string;
  /** Accent (upper arms). */
  accent?: string;
  /** Lower arms + wordmark colour. */
  ink?: string;
  className?: string;
};

export function getLogoMarkGeometry(compact = false) {
  const inner = compact ? 20 : 34;
  const strokeWidth = compact ? 32 : 28;
  const k = 0.70710678;
  const arm = (dx: number, dy: number) =>
    `M${100 + dx * k * inner} ${100 + dy * k * inner} L${100 + dx * k * 90} ${100 + dy * k * 90}`;

  return {
    strokeWidth,
    arms: [
      { d: arm(-1, -1), tone: "accent" as const },
      { d: arm(1, -1), tone: "accent" as const },
      { d: arm(-1, 1), tone: "ink" as const },
      { d: arm(1, 1), tone: "ink" as const },
    ],
  };
}

export function Logo({
  size = 32,
  wordmark = true,
  label = "Xoopa",
  accent = "#F24100",
  ink = "#242424",
  className,
}: LogoProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.23,
        lineHeight: 1,
      }}
    >
      <LogoMark size={size} accent={accent} ink={ink} decorative={wordmark} />
      {wordmark && (
        <span
          style={{
            fontFamily: "var(--font-sans), Satoshi, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: size * 0.69,
            letterSpacing: "-0.03em",
            color: ink,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

export function LogoMark({
  size = 32,
  accent = "#F24100",
  ink = "#242424",
  className,
  decorative = false,
  compact,
}: Pick<LogoProps, "size" | "accent" | "ink" | "className"> & {
  decorative?: boolean;
  compact?: boolean;
}) {
  const tight = compact ?? size < 32;
  const { strokeWidth, arms } = getLogoMarkGeometry(tight);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      strokeLinecap="round"
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Xoopa"}
      aria-hidden={decorative ? true : undefined}
    >
      {arms.map((arm) => (
        <path
          key={arm.d}
          d={arm.d}
          stroke={arm.tone === "accent" ? accent : ink}
          strokeWidth={strokeWidth}
        />
      ))}
    </svg>
  );
}
