"use client";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

type Run = { id: string; cmd: string; stdout: string; stderr: string; exitCode?: number; running: boolean };

export function Terminal({ projectId }: { projectId: string }) {
  const [history, setHistory] = useState<Run[]>([]);
  const [cmd, setCmd] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  async function run() {
    if (!cmd.trim()) return;
    const id = `r-${Date.now()}`;
    const entry: Run = { id, cmd, stdout: "", stderr: "", running: true };
    setHistory((h) => [...h, entry]);
    setCmd("");
    try {
      const r = await fetch(`/api/workspace/${projectId}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: entry.cmd, timeoutMs: 60_000 }),
      });
      const j = await r.json();
      setHistory((h) => h.map((x) => x.id === id ? { ...x, stdout: j.stdout ?? "", stderr: j.stderr ?? "", exitCode: j.exitCode, running: false } : x));
    } catch (e) {
      setHistory((h) => h.map((x) => x.id === id ? { ...x, stderr: String(e), running: false } : x));
    }
  }

  return (
    <div className="h-full flex flex-col bg-black/40 font-mono text-xs">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 && <div className="text-muted-foreground">Run any command in the workspace. Output appears here.</div>}
        {history.map((r) => (
          <div key={r.id}>
            <div className="text-accent">$ {r.cmd}</div>
            {r.stdout && <pre className="whitespace-pre-wrap text-foreground/90">{r.stdout}</pre>}
            {r.stderr && <pre className="whitespace-pre-wrap text-red-400/80">{r.stderr}</pre>}
            {r.running && <div className="text-muted-foreground">running…</div>}
            {!r.running && r.exitCode !== undefined && (
              <div className="text-[10px] text-muted-foreground">exit {r.exitCode}</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-2 border-t border-border">
        <span className="text-accent">$</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          placeholder="ls / pnpm dev / python script.py …"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50"
        />
        <button onClick={run} className="p-1.5 rounded hover:bg-accent/20"><Play className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
