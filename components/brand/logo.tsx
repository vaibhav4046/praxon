import { cn } from "@/lib/utils";

export function PraxonLogo({ size = 28, className, withWord = false, animated = false }: {
  size?: number;
  className?: string;
  withWord?: boolean;
  animated?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size} height={size} viewBox="0 0 32 32"
        className={cn("shrink-0", animated && "anim-flicker")}
        fill="none" xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="praxon-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--accent))" />
            <stop offset="50%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--ring))" />
          </linearGradient>
          <filter id="praxon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer hex frame */}
        <path
          d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
          stroke="url(#praxon-grad)" strokeWidth="1.5"
          fill="hsl(var(--accent) / 0.06)"
          filter="url(#praxon-glow)"
        />
        {/* Inner stylized P / circuit */}
        <path
          d="M11 9 L11 23 M11 9 L18 9 Q22 9 22 13 Q22 17 18 17 L11 17"
          stroke="url(#praxon-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          fill="none"
          filter="url(#praxon-glow)"
        />
        {/* Circuit dots */}
        <circle cx="11" cy="23" r="1.4" fill="hsl(var(--accent))" />
        <circle cx="22" cy="13" r="1.2" fill="hsl(var(--primary))" />
      </svg>
      {withWord && (
        <span className="font-mono font-semibold tracking-tight text-foreground">PRAXON</span>
      )}
    </span>
  );
}
