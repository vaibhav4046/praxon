"use client";
import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PALETTES = [
  { id: "cyan", name: "Cyan", hue: 195, sat: 100 },
  { id: "blue", name: "Blue", hue: 220, sat: 95 },
  { id: "violet", name: "Violet", hue: 263, sat: 90 },
  { id: "magenta", name: "Magenta", hue: 320, sat: 90 },
  { id: "amber", name: "Amber", hue: 38, sat: 100 },
  { id: "lime", name: "Lime", hue: 80, sat: 90 },
  { id: "matrix", name: "Matrix", hue: 142, sat: 90 },
  { id: "rose", name: "Rose", hue: 350, sat: 90 },
] as const;
export type PaletteId = typeof PALETTES[number]["id"];

const STORE_KEY = "praxon.palette";

export function applyPalette(id: PaletteId) {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
  const root = document.documentElement;
  // Set base hue + sat — globals.css uses these everywhere
  root.style.setProperty("--praxon-hue", String(p.hue));
  root.style.setProperty("--praxon-sat", `${p.sat}%`);
  try { localStorage.setItem(STORE_KEY, id); } catch { /* */ }
}

export function getStoredPalette(): PaletteId {
  if (typeof window === "undefined") return "cyan";
  try {
    const v = localStorage.getItem(STORE_KEY);
    if (v && PALETTES.some((p) => p.id === v)) return v as PaletteId;
  } catch { /* */ }
  return "cyan";
}

export function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyPalette(getStoredPalette());
  }, []);
  return <>{children}</>;
}

export function ThemeSwitch() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PaletteId>("cyan");
  useEffect(() => { setActive(getStoredPalette()); }, []);

  function pick(id: PaletteId) {
    setActive(id);
    applyPalette(id);
    setOpen(false);
  }

  const cur = PALETTES.find((p) => p.id === active) ?? PALETTES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-accent/10 transition-colors"
        title="Theme color"
      >
        <span
          className="w-3.5 h-3.5 rounded-full ring-1 ring-border"
          style={{ background: `hsl(${cur.hue} ${cur.sat}% 60%)` }}
        />
        <Palette className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 rounded-xl glass-strong p-2 shadow-2xl anim-scale-in min-w-[200px]">
            <div className="text-[10px] font-mono text-accent/80 uppercase tracking-[0.15em] px-2 py-1.5">// theme</div>
            <div className="grid grid-cols-4 gap-1 p-1">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent/10 transition-colors group",
                    active === p.id && "bg-accent/15"
                  )}
                  title={p.name}
                >
                  <span
                    className="w-7 h-7 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all relative"
                    style={{
                      background: `linear-gradient(135deg, hsl(${p.hue} ${p.sat}% 55%), hsl(${(p.hue + 30) % 360} ${p.sat}% 65%))`,
                      boxShadow: active === p.id ? `0 0 12px hsl(${p.hue} ${p.sat}% 60% / 0.6)` : "none",
                      ["--tw-ring-color" as string]: active === p.id ? `hsl(${p.hue} ${p.sat}% 60%)` : "transparent",
                    }}
                  >
                    {active === p.id && <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground group-hover:text-foreground">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
