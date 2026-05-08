"use client";
import { useEffect, useState } from "react";
import {
  MessageSquare, Search, Bot, Code2, Backpack, BookOpen,
  Sparkles, Wrench, Check, Workflow, Globe, FileText, Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "chat" | "research" | "agents" | "code" | "backpack" | "memory";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "research", label: "Research", icon: Search },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "code", label: "Code", icon: Code2 },
  { id: "backpack", label: "Backpack", icon: Backpack },
  { id: "memory", label: "Memory", icon: BookOpen },
];

export function InteractiveDemo() {
  const [tab, setTab] = useState<TabId>("chat");
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => {
      const idx = TABS.findIndex((x) => x.id === tab);
      setTab(TABS[(idx + 1) % TABS.length].id);
    }, 4500);
    return () => clearTimeout(t);
  }, [tab, autoplay]);

  return (
    <div className="rounded-2xl glass-strong overflow-hidden praxon-glow max-w-5xl mx-auto crt anim-scanline">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-accent/30 bg-card/60">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 anim-pulse-glow" />
        <span className="ml-3 text-[11px] text-accent font-mono mono-num">praxon@matrix:~/projects/admitos $</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">{autoplay ? "AUTO" : "MANUAL"}</span>
          <button
            onClick={() => setAutoplay((a) => !a)}
            className={cn("w-7 h-3.5 rounded-full transition-colors", autoplay ? "bg-accent" : "bg-muted")}
            aria-label="Toggle autoplay"
          >
            <span className={cn("block w-2.5 h-2.5 rounded-full bg-card transition-transform translate-y-0.5", autoplay ? "translate-x-3.5" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-accent/20 bg-card/30 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setAutoplay(false); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all whitespace-nowrap",
                active ? "bg-accent/20 text-accent neon-text" : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
              )}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-12 h-[400px] text-left">
        <div className="col-span-3 border-r border-accent/15 p-3 space-y-1 bg-card/30 hidden md:block">
          <div className="text-[9px] font-mono text-accent/70 uppercase tracking-wider px-2 py-1">Sidebar</div>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setAutoplay(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors",
                tab === t.id ? "bg-accent/15 text-accent" : "text-muted-foreground/80 hover:text-foreground"
              )}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>
        <div className="col-span-12 md:col-span-9 p-5 overflow-y-auto">
          <TabContent key={tab} tab={tab} />
        </div>
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case "chat": return <ChatDemo />;
    case "research": return <ResearchDemo />;
    case "agents": return <AgentsDemo />;
    case "code": return <CodeDemo />;
    case "backpack": return <BackpackDemo />;
    case "memory": return <MemoryDemo />;
  }
}

function ChatDemo() {
  const [text, setText] = useState("");
  const target = "Done. Routine \"daily-news\" runs every day at 09:00.";
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i > target.length) { clearInterval(id); return; }
      setText(target.slice(0, i));
    }, 25);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col gap-3 anim-fade-in">
      <Pill>You</Pill>
      <p className="text-sm">Build me a daily news agent that posts to Slack at 8am.</p>
      <div className="flex items-center gap-1.5 mt-2">
        <Pill accent>Praxon</Pill>
        <span className="text-[10px] font-mono text-muted-foreground">groq · 142ms</span>
      </div>
      <ToolCall name="web_search" args="query: top tech news 2026" />
      <ToolCall name="memory_save" args="key: digest_target, value: #daily-news" />
      <ToolCall name="schedule_routine" args="cron: 0 9 * * *" />
      <p className="text-sm leading-relaxed">
        {text}<span className="anim-cursor">▎</span>
      </p>
    </div>
  );
}

function ResearchDemo() {
  return (
    <div className="anim-fade-in space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-mono text-accent">DEEP_RESEARCH ::</span>
        <span className="text-xs">latest AI agent frameworks 2026</span>
      </div>
      <div className="rounded border border-accent/20 bg-card/30 p-3 text-xs space-y-1.5">
        <div className="text-[10px] font-mono text-accent/80">PLAN</div>
        {["AI agent frameworks 2026 comparison", "open source agent SDK ranking", "production-ready agent benchmarks"].map((q, i) => (
          <div key={i} className="flex items-start gap-2 anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
            <span className="text-accent">{i + 1}.</span>
            <span className="text-muted-foreground">{q}</span>
          </div>
        ))}
      </div>
      <div className="rounded border border-accent/20 bg-card/30 p-3 text-xs">
        <div className="text-[10px] font-mono text-accent/80 mb-1.5">SYNTHESIS</div>
        <p className="leading-relaxed">
          Top frameworks ranked by production fit: LangGraph<Cite n={1} /> for control, Claude Agent SDK<Cite n={2} /> for Anthropic-native, CrewAI<Cite n={3} /> for team velocity.<span className="anim-cursor">▎</span>
        </p>
      </div>
    </div>
  );
}

function AgentsDemo() {
  return (
    <div className="anim-fade-in space-y-2">
      <div className="flex items-center gap-2">
        <Bot className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-mono text-accent">AUTONOMOUS_AGENT ::</span>
        <span className="text-xs">Build Express server w/ /ping endpoint, run on port 4000</span>
      </div>
      {[
        { n: 1, label: "shell", text: "mkdir api && cd api && npm init -y" },
        { n: 2, label: "write_file", text: "server.js — 14 lines" },
        { n: 3, label: "shell", text: "npm i express && node server.js &" },
        { n: 4, label: "fetch_url", text: "GET http://localhost:4000/ping → 200 OK" },
      ].map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-accent/15 bg-card/40 anim-fade-up" style={{ animationDelay: `${i * 200}ms` }}>
          <span className="w-5 h-5 rounded-full praxon-gradient grid place-items-center text-[9px] font-bold text-black mono-num">{s.n}</span>
          <span className="text-[11px] font-mono text-accent">{s.label}</span>
          <span className="text-xs text-muted-foreground truncate flex-1">{s.text}</span>
          <Check className="w-3 h-3 text-emerald-400" />
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2 text-xs text-accent">
        <Check className="w-3.5 h-3.5" /> <span className="font-mono">GOAL_MET</span>
      </div>
    </div>
  );
}

function CodeDemo() {
  return (
    <div className="anim-fade-in font-mono text-[11px] space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs text-accent">~/projects/admitos/server.js</span>
      </div>
      <Line n={1}><span className="text-accent">import</span> express <span className="text-accent">from</span> <span className="text-emerald-400">"express"</span>;</Line>
      <Line n={2} />
      <Line n={3}><span className="text-accent">const</span> app <span className="text-muted-foreground">=</span> express();</Line>
      <Line n={4}><span className="text-accent">const</span> port <span className="text-muted-foreground">=</span> <span className="text-orange-400">4000</span>;</Line>
      <Line n={5} />
      <Line n={6}>app.<span className="text-cyan-400">get</span>(<span className="text-emerald-400">"/ping"</span>, (req, res) <span className="text-muted-foreground">=&gt;</span> {`{`}</Line>
      <Line n={7}>  res.<span className="text-cyan-400">json</span>({`{`} ok: <span className="text-orange-400">true</span> {`}`});</Line>
      <Line n={8}>{`}`});</Line>
      <Line n={9} />
      <Line n={10}>app.<span className="text-cyan-400">listen</span>(port, () <span className="text-muted-foreground">=&gt;</span> console.<span className="text-cyan-400">log</span>(<span className="text-emerald-400">{"`up :${port}`"}</span>));</Line>
      <div className="mt-3 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 inline-flex items-center gap-1.5">
        <Terminal className="w-3 h-3" /> $ node server.js → up :4000
      </div>
    </div>
  );
}

function BackpackDemo() {
  return (
    <div className="anim-fade-in space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Backpack className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-mono text-accent">BACKPACK ::</span>
        <span className="text-xs text-muted-foreground">3 pinned items in context every chat</span>
      </div>
      {[
        { name: "Project Brief.md", kind: "note", size: "1.2 KB" },
        { name: "stack-rules.txt", kind: "file", size: "486 B" },
        { name: "API_spec.json", kind: "file", size: "8.4 KB" },
      ].map((it, i) => (
        <div key={it.name} className="flex items-center gap-2.5 px-3 py-2 rounded border border-accent/15 bg-card/40 anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
          <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="text-xs flex-1">{it.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground mono-num">{it.size}</span>
          <span className="text-[9px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 font-mono">PINNED</span>
        </div>
      ))}
    </div>
  );
}

function MemoryDemo() {
  return (
    <div className="anim-fade-in space-y-2 font-mono text-[11px]">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs text-accent">PROJECT_MEMORY :: admitos</span>
      </div>
      <div className="rounded border border-accent/20 bg-card/40 p-3 space-y-1">
        {[
          "User is Vaibhav (solo dev, AdmitOS for AdropEDU under Andy Yu)",
          "Stack: Next 15 + 3-schema Supabase + /src/* layout (non-negotiable)",
          "DeepSeek banned · no hardcoded prompts · no numerical %",
          "M1 sign-off end of Week 2 (~2026-04-23)",
          "Always reply in TypeScript when coding",
          "Prefer minimal commentary",
        ].map((m, i) => (
          <div key={i} className="flex items-start gap-2 anim-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="text-accent">▸</span>
            <span className="text-foreground/90">{m}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
        <Sparkles className="w-3 h-3 text-accent" /> Auto-injected into every chat in this project
      </div>
    </div>
  );
}

function Pill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
      accent ? "bg-accent/15 text-accent border border-accent/30" : "bg-muted text-muted-foreground"
    )}>{children}</span>
  );
}

function ToolCall({ name, args }: { name: string; args: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-accent/20 bg-card/40 text-[11px]">
      <Wrench className="w-3 h-3 text-accent" />
      <code className="font-mono text-accent">{name}</code>
      <span className="text-muted-foreground truncate flex-1">{args}</span>
      <Check className="w-3 h-3 text-emerald-400" />
    </div>
  );
}

function Line({ n, children }: { n: number; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="text-muted-foreground/40 mono-num w-6 text-right select-none">{n}</span>
      <span className="flex-1">{children ?? <span>&nbsp;</span>}</span>
    </div>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[16px] h-[14px] px-1 mx-0.5 rounded bg-accent/15 hover:bg-accent/30 text-accent text-[9px] font-mono align-text-top transition-colors cursor-pointer">{n}</span>
  );
}

void Workflow; void Globe;
