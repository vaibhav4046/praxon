"use client";
import { useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import { Bot, Loader2, Play, CheckCircle2, AlertCircle, Square } from "lucide-react";

type Event =
  | { type: "step"; n: number; thought: string; output: string }
  | { type: "done"; reason: string; final: string }
  | { type: "error"; message: string };

export default function AgentsPage() {
  const [goal, setGoal] = useState("");
  const [maxSteps, setMaxSteps] = useState(6);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const acRef = useRef<AbortController | null>(null);

  async function run() {
    if (!goal.trim() || running) return;
    setRunning(true);
    setEvents([]);
    const ac = new AbortController();
    acRef.current = ac;
    try {
      const r = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, maxSteps }),
        signal: ac.signal,
      });
      const reader = r.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try { setEvents((p) => [...p, JSON.parse(line) as Event]); } catch { /* */ }
        }
      }
    } catch (e) {
      setEvents((p) => [...p, { type: "error", message: String(e) }]);
    } finally {
      setRunning(false);
    }
  }

  function stop() { acRef.current?.abort(); }

  const steps = events.filter((e) => e.type === "step") as Extract<Event, { type: "step" }>[];
  const done = events.find((e) => e.type === "done") as Extract<Event, { type: "done" }> | undefined;
  const err = events.find((e) => e.type === "error") as Extract<Event, { type: "error" }> | undefined;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto h-screen anim-fade-in">
        <PageHeader
          module="AUTONOMOUS · AGENTS"
          title="Self-directed loops"
          subtitle="Give a goal. Praxon plans, acts, iterates until done."
          icon={Bot}
        />

        <section className="rounded-2xl border border-border bg-card/40 p-5 mb-6">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. 'Build a simple Express server with a /ping endpoint, save it to server.js, and run it on port 4000.'"
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between mt-3">
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              Max steps:
              <input
                type="number"
                min={1}
                max={20}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Math.max(1, Math.min(20, Number(e.target.value) || 6)))}
                className="w-16 px-2 py-1 rounded border border-input bg-background text-sm"
              />
            </label>
            <div className="flex gap-2">
              {running && (
                <button onClick={stop} className="px-3 py-2 rounded-lg border border-border text-sm flex items-center gap-1.5">
                  <Square className="w-3 h-3" /> Stop
                </button>
              )}
              <button
                onClick={run}
                disabled={running || !goal.trim()}
                className="px-4 py-2 rounded-lg praxon-gradient text-white text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {running ? "Running…" : "Launch agent"}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full praxon-gradient grid place-items-center text-[10px] font-bold text-white">{s.n}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Step {s.n}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{s.output}</pre>
            </div>
          ))}
          {err && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <span className="text-sm text-destructive">{err.message}</span>
            </div>
          )}
          {done && (
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-xs uppercase tracking-wider text-accent">Done · {done.reason}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm">{done.final}</pre>
            </div>
          )}
          {!steps.length && !running && !err && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Launch an agent to see its step-by-step trace here.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
