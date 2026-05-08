"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Code2, FolderKanban, Sparkles, Clock, Plug, Search, Bot,
  LayoutDashboard, Settings, Zap, BookOpen,
} from "lucide-react";

type Cmd = { id: string; label: string; group: string; icon: React.ElementType; href?: string; action?: () => void; keywords?: string };
type Hit = { id: string; title: string; snippet: string; updatedAt: number; matchType: "title" | "message" };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState<Hit[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setIdx(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setHits([]); return; }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/sessions/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json()).then((d) => setHits(d.hits ?? [])).catch(() => setHits([]));
    }, 200);
  }, [q]);

  const cmds: Cmd[] = [
    { id: "chat", label: "New chat", group: "Go", icon: MessageSquare, href: "/chat", keywords: "talk message" },
    { id: "dash", label: "Dashboard", group: "Go", icon: LayoutDashboard, href: "/dashboard", keywords: "home overview" },
    { id: "code", label: "Code workspace", group: "Go", icon: Code2, href: "/code", keywords: "editor terminal monaco" },
    { id: "research", label: "Deep research", group: "Go", icon: Search, href: "/research", keywords: "investigate web sources" },
    { id: "agents", label: "Autonomous agents", group: "Go", icon: Bot, href: "/agents", keywords: "loop self-directed" },
    { id: "projects", label: "Projects", group: "Go", icon: FolderKanban, href: "/projects" },
    { id: "skills", label: "Skills", group: "Go", icon: Sparkles, href: "/skills", keywords: "prompt template" },
    { id: "tasks", label: "Routines (cron)", group: "Go", icon: Clock, href: "/tasks", keywords: "schedule background" },
    { id: "connections", label: "Connections (MCP, providers)", group: "Go", icon: Plug, href: "/connections", keywords: "integrations" },
    { id: "settings", label: "Settings", group: "Go", icon: Settings, href: "/settings" },
    { id: "onboarding", label: "Onboarding wizard", group: "Setup", icon: Zap, href: "/onboarding", keywords: "setup keys" },
    { id: "docs", label: "Open README", group: "Help", icon: BookOpen, action: () => window.open("https://github.com/praxon-dev/praxon#readme", "_blank") },
  ];

  const filtered: Cmd[] = [
    ...hits.map((h) => ({
      id: `s-${h.id}`,
      label: h.title || "Untitled",
      group: "Conversations",
      icon: MessageSquare,
      href: `/chat?session=${h.id}`,
      keywords: h.snippet,
    })),
    ...cmds.filter((c) => {
      if (!q.trim()) return true;
      const hay = `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    }),
  ];

  function exec(c: Cmd) {
    setOpen(false);
    setQ("");
    if (c.href) router.push(c.href);
    else if (c.action) c.action();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-start pt-32 px-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl mx-auto rounded-xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(filtered.length - 1, i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === "Enter" && filtered[idx]) exec(filtered[idx]);
            }}
            placeholder="Jump to anything…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No matches.</div>
          ) : (
            <CommandGroups cmds={filtered} idx={idx} onExec={exec} />
          )}
        </div>
        <div className="border-t border-border px-3 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><kbd className="border border-border rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-border rounded px-1">↵</kbd> select</span>
          <span className="ml-auto"><kbd className="border border-border rounded px-1">⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}

function CommandGroups({ cmds, idx, onExec }: { cmds: Cmd[]; idx: number; onExec: (c: Cmd) => void }) {
  const groups: Record<string, Cmd[]> = {};
  cmds.forEach((c) => { (groups[c.group] ??= []).push(c); });
  let n = 0;
  return (
    <>
      {Object.entries(groups).map(([group, list]) => (
        <div key={group} className="mb-1">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{group}</div>
          {list.map((c) => {
            const active = n === idx;
            const myIdx = n++;
            return (
              <button
                key={c.id}
                onClick={() => onExec(c)}
                onMouseEnter={() => { /* hover not changing idx to avoid jitter */ }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${active ? "bg-accent/15 text-foreground" : "hover:bg-accent/10"}`}
              >
                <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                {c.label}
                <span className="ml-auto text-[10px] text-muted-foreground">{myIdx === idx ? "↵" : ""}</span>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}
