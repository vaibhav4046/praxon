import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("anim-spin-slow", className)}
      width="16" height="16" viewBox="0 0 16 16" fill="none"
    >
      <defs>
        <linearGradient id="praxon-spin" x1="0" y1="0" x2="16" y2="16">
          <stop offset="0%" stopColor="hsl(263 90% 70%)" />
          <stop offset="50%" stopColor="hsl(310 90% 65%)" />
          <stop offset="100%" stopColor="hsl(20 95% 65%)" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" stroke="hsl(var(--muted) / 0.4)" strokeWidth="1.5" />
      <path
        d="M8 1.5 a 6.5 6.5 0 0 1 6.5 6.5"
        stroke="url(#praxon-spin)" strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" style={{ animation: "fadeIn 1s ease-in-out infinite", animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" style={{ animation: "fadeIn 1s ease-in-out infinite", animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" style={{ animation: "fadeIn 1s ease-in-out infinite", animationDelay: "300ms" }} />
    </span>
  );
}
