interface LogomarkProps {
  size?: number;
  className?: string;
}

/**
 * The "SC" monogram — the same mark rendered as the site favicon
 * (src/app/icon.tsx: ink square, canteen-orange serif "SC"). Kept as a
 * plain styled div rather than reusing the /icon PNG route so it stays
 * crisp at any size and never costs an extra image request; this is the
 * canonical business logo — reuse it anywhere a logo is needed rather than
 * re-deriving the mark.
 */
export function Logomark({ size = 32, className = "" }: LogomarkProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[22%] bg-ink font-display font-semibold text-canteen ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.53, letterSpacing: "-0.02em" }}
    >
      SC
    </div>
  );
}
