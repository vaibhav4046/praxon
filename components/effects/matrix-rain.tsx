"use client";
import { useEffect, useRef } from "react";

export function MatrixRain({ opacity = 0.15, density = 1.0 }: { opacity?: number; density?: number } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0, rows = 0;
    let drops: number[] = [];
    const fontSize = 14;
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモPRAXON{}<>[]/=+-*";

    function resize() {
      if (!canvas || !ctx) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
      cols = Math.ceil(window.innerWidth / fontSize) * density;
      rows = Math.ceil(window.innerHeight / fontSize);
      drops = new Array(Math.ceil(cols)).fill(0).map(() => Math.floor(Math.random() * rows));
    }

    function readHue(): { hue: string; sat: string } {
      const cs = getComputedStyle(document.documentElement);
      const hue = cs.getPropertyValue("--praxon-hue").trim() || "195";
      const sat = cs.getPropertyValue("--praxon-sat").trim() || "100%";
      return { hue, sat };
    }

    function frame() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "rgba(6, 10, 18, 0.08)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const { hue, sat } = readHue();
      ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", Menlo, monospace`;
      for (let i = 0; i < drops.length; i++) {
        const x = (i * (window.innerWidth / drops.length));
        const y = drops[i] * fontSize;
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const isHead = Math.random() > 0.96;
        ctx.fillStyle = isHead
          ? `hsl(${hue} ${sat} 85% / ${opacity * 1.8})`
          : `hsl(${hue} ${sat} 60% / ${opacity})`;
        ctx.fillText(ch, x, y);
        if (y > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }

    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    let last = 0;
    function loop(ts: number) {
      if (ts - last > 60) { frame(); last = ts; }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [opacity, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
