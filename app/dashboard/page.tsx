"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import {
  Activity, Bot, Code2, FolderKanban, Sparkles, Clock, MessageSquare,
  Plug, ArrowRight, Zap, Search, Workflow, BookOpen, LayoutDashboard,
} from "lucide-react";

type DashboardData = {
  counts: { projects: number; sessions: number; skills: number; tasksTotal: number; tasksEnabled: number; providers: number };
  week: { userMessages: number; assistantMessages: number; providerCounts: Record<string, number> };
  recentSessions: { id: string; title: string; updatedAt: number }[];
  activeRoutines: { id: string; name: string; cron: string; lastRun: number | null }[];
  providers: { name: string; free: boolean; local: boolean }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto h-screen anim-fade-in">
        <PageHeader
          module="DASHBOARD"
          title="Operations"
          subtitle="System overview · Last 7 days · Real-time"
          icon={LayoutDashboard}
          actions={
            <>
              <Link href="/chat" className="px-3 py-2 rounded-lg praxon-gradient text-black text-xs font-mono font-bold flex items-center gap-1.5 hover:scale-105 transition-transform praxon-glow uppercase">
                <Zap className="w-3.5 h-3.5" /> New chat
              </Link>
              <Link href="/research" className="px-3 py-2 rounded-lg glass text-xs font-mono flex items-center gap-1.5 hover:border-accent/60 transition-colors uppercase">
                <Search className="w-3.5 h-3.5" /> Deep research
              </Link>
            </>
          }
        />

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger">
          <KPI icon={MessageSquare} label="Sessions" value={data?.counts.sessions ?? 0} sub="all time" loading={!data} />
          <KPI icon={FolderKanban} label="Projects" value={data?.counts.projects ?? 0} loading={!data} />
          <KPI icon={Workflow} label="Routines active" value={`${data?.counts.tasksEnabled ?? 0}/${data?.counts.tasksTotal ?? 0}`} loading={!data} />
          <KPI icon={Plug} label="Providers" value={data?.counts.providers ?? 0} sub="free LLMs" loading={!data} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Last 7 days</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Your messages" value={data?.week.userMessages ?? 0} />
              <Stat label="Assistant replies" value={data?.week.assistantMessages ?? 0} />
              <Stat label="Active providers" value={Object.keys(data?.week.providerCounts ?? {}).length} />
            </div>
            {data && Object.keys(data.week.providerCounts).length > 0 && (
              <div className="mt-5">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Provider mix</div>
                <ProviderBar counts={data.week.providerCounts} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/40 p-5">
            <h2 className="font-medium flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-accent" /> Quick actions</h2>
            <div className="space-y-2">
              <QuickAction href="/chat" icon={MessageSquare} label="Start chat" />
              <QuickAction href="/code" icon={Code2} label="Open code workspace" />
              <QuickAction href="/research" icon={Search} label="Deep research" />
              <QuickAction href="/agents" icon={Bot} label="Autonomous agents" />
              <QuickAction href="/tasks" icon={Clock} label="Schedule a routine" />
              <QuickAction href="/skills" icon={BookOpen} label="Create a skill" />
              <QuickAction href="/connections" icon={Plug} label="Add MCP server" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Panel title="Recent sessions" link="/chat" linkLabel="All chats">
            {data?.recentSessions.length ? data.recentSessions.map((s) => (
              <Link key={s.id} href={`/chat?session=${s.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/10">
                <span className="text-sm truncate">{s.title || "Untitled"}</span>
                <span className="text-[10px] text-muted-foreground">{relTime(s.updatedAt)}</span>
              </Link>
            )) : <Empty>No sessions yet.</Empty>}
          </Panel>
          <Panel title="Active routines" link="/tasks" linkLabel="All routines">
            {data?.activeRoutines.length ? data.activeRoutines.map((t) => (
              <div key={t.id} className="rounded-lg px-3 py-2 hover:bg-accent/10">
                <div className="text-sm">{t.name}</div>
                <div className="text-[10px] text-muted-foreground"><code>{t.cron}</code> · last: {t.lastRun ? relTime(t.lastRun) : "never"}</div>
              </div>
            )) : <Empty>No routines active. <Link href="/tasks" className="text-accent hover:underline">Create one</Link>.</Empty>}
          </Panel>
        </section>
      </main>
    </div>
  );
}

function KPI({ icon: I, label, value, sub, loading }: { icon: React.ElementType; label: string; value: string | number; sub?: string; loading?: boolean }) {
  return (
    <div className="group relative rounded-xl border border-accent/20 bg-card/40 p-4 hover:border-accent/60 transition-colors overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-accent/80">{label}</div>
        <I className="w-4 h-4 text-accent" />
      </div>
      {loading ? (
        <div className="h-9 w-16 rounded bg-muted/60 anim-shimmer" />
      ) : (
        <div className="text-3xl font-semibold mono-num text-foreground neon-text">{value}</div>
      )}
      {sub && <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">{sub}</div>}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-background/30 p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ProviderBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {entries.map(([name, count], i) => (
          <div
            key={name}
            style={{ width: `${(count / total) * 100}%`, backgroundColor: barColor(i) }}
            title={`${name}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {entries.map(([name, count], i) => (
          <span key={name} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: barColor(i) }} />
            {name} <span className="text-muted-foreground">({count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function barColor(i: number): string {
  const colors = ["hsl(142 90% 60%)", "hsl(160 90% 55%)", "hsl(180 80% 55%)", "hsl(120 80% 55%)", "hsl(190 90% 55%)"];
  return colors[i % colors.length];
}

function QuickAction({ href, icon: I, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent/10 group">
      <I className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent" />
      <span className="text-sm flex-1">{label}</span>
      <ArrowRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-accent" />
    </Link>
  );
}

function Panel({ title, link, linkLabel, children }: { title: string; link: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">{title}</h2>
        <Link href={link} className="text-xs text-accent hover:underline">{linkLabel}</Link>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground py-4 text-center">{children}</div>;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
