"use client";
import { useEffect, useState } from "react";

const BOOT_LINES = [
  "[OK] Mounting /dev/praxon",
  "[OK] Loading kernel modules: ai-sdk, mcp, playwright",
  "[OK] Initializing free LLM router (8 providers)",
  "[OK] Spawning agent runtime",
  "[OK] Linking memory + backpack + skills",
  "[OK] Boot complete — 0.142s",
];

export default function Loading() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= BOOT_LINES.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 90);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <main className="min-h-screen grid place-items-center px-6 font-mono text-xs anim-fade-in">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 anim-pulse-glow" />
          <span className="text-accent">PRAXON</span>
          <span className="text-muted-foreground">v0.1 — booting</span>
        </div>
        <div className="rounded border border-accent/30 bg-card/40 p-4 space-y-1 crt anim-scanline">
          {BOOT_LINES.slice(0, shown).map((line, i) => (
            <div key={i} className="flex items-start gap-2 anim-fade-up">
              <span className="text-accent/70">{`>`}</span>
              <span className={line.startsWith("[OK]") ? "text-emerald-400" : "text-foreground/80"}>{line}</span>
            </div>
          ))}
          {shown < BOOT_LINES.length && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="anim-cursor">█</span>
              <span className="text-[10px]">{Math.round((shown / BOOT_LINES.length) * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
