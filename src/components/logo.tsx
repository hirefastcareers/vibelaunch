type LogoProps = {
  /** Height of the mark in px. Wordmark scales with it. */
  size?: number;
  /** Show the "Sorano" wordmark next to the mark. */
  wordmark?: boolean;
  /** Text to render as the wordmark. */
  label?: string;
  /** Accent (outer arc). */
  accent?: string;
  /** Inner arc + wordmark colour. */
  ink?: string;
  className?: string;
};

export function Logo({
  size = 32,
  wordmark = true,
  label = "Sorano",
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
        gap: size * 0.17,
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
}: Pick<LogoProps, "size" | "accent" | "ink" | "className"> & {
  decorative?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Sorano"}
      aria-hidden={decorative ? true : undefined}
    >
      <path d="M159.4 159.4 A84 84 0 1 1 159.4 40.6" stroke={accent} strokeWidth={26} />
      <path d="M132.53 132.53 A46 46 0 1 1 132.53 67.47" stroke={ink} strokeWidth={26} />
    </svg>
  );
}
