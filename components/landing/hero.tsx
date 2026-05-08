"use client";
import Link from "next/link";
import { ArrowRight, Github, Sparkles, Zap, Code2, Globe, Mic, Clock, Plug, Brain, Workflow, Lock, Search, Bot, Backpack } from "lucide-react";
import { useEffect, useState } from "react";
import { InteractiveDemo } from "./interactive-demo";

export function LandingHero() {
  const [providerCount, setProviderCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((d) => setProviderCount(d.providerCount ?? 0)).catch(() => setProviderCount(0));
  }, []);

  return (
    <section className="relative">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
        <Link
          href="https://github.com/praxon-dev/praxon"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/40 text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition-colors mb-8 anim-fade-in"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent anim-pulse-glow" />
          Open-source · MIT · v0.1
          <ArrowRight className="w-3 h-3" />
        </Link>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[1.02] mb-6 anim-fade-up">
          <span className="text-gradient">The AI agent</span>
          <br />
          built for <span className="text-accent-gradient">everything.</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 anim-fade-up" style={{ animationDelay: "120ms" }}>
          Open-source replacement for Claude Cowork, Claude Code, and Perplexity Computer. Free LLMs. Local-first. One workspace for chat, code, research, automation.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 anim-fade-up" style={{ animationDelay: "200ms" }}>
          <Link
            href={providerCount === 0 ? "/onboarding" : "/chat"}
            className="group inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            {providerCount === 0 ? "Get started" : "Open Praxon"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="https://github.com/praxon-dev/praxon"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-border bg-card/40 hover:border-accent/40 text-sm transition-colors"
          >
            <Github className="w-4 h-4" /> GitHub
          </a>
        </div>

        {/* Interactive demo */}
        <div className="mt-20 anim-fade-up" style={{ animationDelay: "320ms" }}>
          <InteractiveDemo />
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Sparkles, title: "Chat", desc: "Streaming across 8 free LLM providers with auto-fallback." },
  { icon: Code2, title: "Code workspace", desc: "Monaco editor, terminal, file tree — paired with your agent." },
  { icon: Search, title: "Deep research", desc: "Multi-step web research with citations and source attribution." },
  { icon: Bot, title: "Autonomous agents", desc: "Goal-driven loops. Plans, acts, iterates until done." },
  { icon: Workflow, title: "Routines", desc: "Cron-scheduled prompts. Background agents that run themselves." },
  { icon: Globe, title: "Browser tools", desc: "Real Playwright Chromium. Navigate, click, extract." },
  { icon: Backpack, title: "Backpack", desc: "Pin files and notes per project. Auto-injected into every chat." },
  { icon: Brain, title: "Memory", desc: "Per-project facts that persist across sessions." },
  { icon: Mic, title: "Voice input", desc: "Hands-free dictation. Browser-native, zero setup." },
  { icon: Plug, title: "MCP-native", desc: "Connect any Model Context Protocol server." },
  { icon: Lock, title: "Local-first", desc: "Data stored locally. Bring your own keys." },
  { icon: Zap, title: "Self-host", desc: "One Docker command. Vercel-ready. Postgres-backed." },
];

export function FeatureGrid() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] mb-3">
          Everything paid platforms charge for.
        </h2>
        <p className="text-muted-foreground text-base max-w-xl mx-auto">
          Built for the way modern AI work actually happens.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border stagger">
        {FEATURES.map((f) => (
          <div key={f.title} className="group bg-background p-6 hover:bg-card/40 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-card border border-border grid place-items-center mb-4 group-hover:border-accent/40 transition-colors">
              <f.icon className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-medium text-[15px] mb-1.5">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ComparisonStrip() {
  const COWORK = ["Chat across models", "Skills", "MCP servers", "Projects + memory", "Routines (cron)", "File uploads", "Voice input", "Artifacts"];
  const PRAXON_EXTRA = ["Free LLMs (8 providers)", "Local-first by default", "Self-host in 1 Docker command", "Code workspace + terminal", "Deep research mode", "Autonomous agents", "Backpack (auto-context)", "MIT · No subscription"];
  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-7">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Claude Cowork has</div>
            <ul className="space-y-2.5">
              {COWORK.map((c) => (
                <li key={c} className="text-sm flex items-center gap-2.5 text-foreground/80">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />{c}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-7 praxon-gradient-soft">
            <div className="text-xs uppercase tracking-wider text-accent mb-4">Praxon adds</div>
            <ul className="space-y-2.5">
              {PRAXON_EXTRA.map((c) => (
                <li key={c} className="text-sm flex items-center gap-2.5 text-foreground/90">
                  <span className="w-1 h-1 rounded-full bg-accent" />{c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTAStrip() {
  return (
    <section className="max-w-4xl mx-auto px-6 pb-32">
      <div className="rounded-2xl border border-border bg-card/40 px-8 py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        <div className="relative">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] mb-3">
            Ready in 60 seconds.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
            One free Groq key, or run Ollama locally. Praxon takes care of the rest.
          </p>
          <div className="max-w-md mx-auto mb-8 rounded-lg border border-border bg-background/60 overflow-hidden text-left">
            {[
              "pnpm install",
              "pnpm dev",
              "open http://localhost:3000",
            ].map((cmd, i) => (
              <div key={cmd} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 font-mono text-xs">
                <span className="text-muted-foreground/50 mono-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-accent">$</span>
                <span className="text-foreground/90">{cmd}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/onboarding" className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/chat" className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-border bg-card/40 hover:border-accent/40 text-sm transition-colors">
              Skip to chat
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded praxon-gradient grid place-items-center"><Zap className="w-3 h-3 text-white" /></div>
          Praxon · MIT
        </div>
        <div className="flex items-center gap-4">
          <Link href="/chat" className="hover:text-foreground transition-colors">Chat</Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <a href="https://github.com/praxon-dev/praxon" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
