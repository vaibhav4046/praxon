"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, Code2, FolderKanban, Sparkles, Clock, Plug,
  Plus, Settings, LayoutDashboard, Search, Bot, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PraxonLogo } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/brand/theme-switch";

type Project = { id: string; name: string };
type Session = { id: string; title: string; projectId: string | null; updatedAt: number };

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/research", label: "Research", icon: Search },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/code", label: "Code", icon: Code2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/tasks", label: "Routines", icon: Clock },
  { href: "/connections", label: "Connections", icon: Plug },
];

export function Sidebar() {
  const path = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects ?? [])).catch(() => {});
    fetch("/api/sessions").then((r) => r.json()).then((d) => setSessions(d.sessions ?? [])).catch(() => {});
  }, [path]);

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg glass"
        aria-label="Open sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      {open && <div onClick={() => setOpen(false)} className="md:hidden fixed inset-0 bg-black/60 z-40" />}

      <aside className={cn(
        "w-64 shrink-0 h-screen sticky top-0 border-r border-accent/20 bg-card/30 flex flex-col z-50 transition-transform backdrop-blur-md",
        "max-md:fixed max-md:left-0",
        open ? "translate-x-0" : "max-md:-translate-x-full md:translate-x-0",
      )}>
        <div className="p-4 border-b border-accent/20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="group-hover:scale-105 transition-transform">
              <PraxonLogo size={32} animated />
            </div>
            <div>
              <div className="font-semibold tracking-tight font-mono">PRAXON</div>
              <div className="text-[10px] text-accent/80 -mt-0.5 font-mono">[v0.1 · agent.os]</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeSwitch />
            <button onClick={() => setOpen(false)} className="md:hidden p-1.5 rounded hover:bg-accent/10" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: isMac, ctrlKey: !isMac });
            window.dispatchEvent(e);
          }}
          className="mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background/50 text-xs text-muted-foreground hover:border-accent/40 transition-colors"
        >
          <Search className="w-3 h-3" /> Search
          <kbd className="ml-auto border border-border rounded px-1 py-0.5 text-[9px]">⌘K</kbd>
        </button>

        <nav className="px-2 py-2 space-y-0.5">
          {NAV.map((n) => {
            const active = path === n.href || (n.href !== "/" && path.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  active ? "bg-accent/15 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                )}
              >
                <n.icon className="w-3.5 h-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent</span>
          <Link href="/chat" className="text-muted-foreground hover:text-foreground" aria-label="New chat">
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sessions.slice(0, 30).map((s) => (
            <Link
              key={s.id}
              href={`/chat?session=${s.id}`}
              className="block px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 truncate"
              title={s.title}
            >
              {s.title || "Untitled"}
            </Link>
          ))}
          {sessions.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-muted-foreground/60">No chats yet.</div>
          )}
        </div>

        <div className="border-t border-border p-2">
          {projects.length > 0 && (
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Projects</span>
              {projects.length > 3 && (
                <Link href="/projects" className="text-[10px] text-accent hover:underline">View all ({projects.length})</Link>
              )}
            </div>
          )}
          {projects.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 truncate"
            >
              {p.name}
            </Link>
          ))}
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 mt-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
