"use client";
import { useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Search, Loader2, Globe, FileText, ListChecks, AlertCircle, ExternalLink } from "lucide-react";

type Event =
  | { type: "plan"; intent: string; subqueries: string[] }
  | { type: "search"; query: string; results: { title: string; url: string; snippet: string }[] }
  | { type: "fetch"; url: string; ok: boolean; bytes: number }
  | { type: "synthesis"; markdown: string; sources: { url: string; title: string }[] }
  | { type: "error"; message: string };

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const acRef = useRef<AbortController | null>(null);

  async function run() {
    if (!query.trim() || running) return;
    setRunning(true);
    setEvents([]);
    const ac = new AbortController();
    acRef.current = ac;
    try {
      const r = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxSubqueries: 5, maxFetchPerQuery: 3 }),
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
          try {
            const ev = JSON.parse(line) as Event;
            setEvents((prev) => [...prev, ev]);
          } catch { /* tolerate */ }
        }
      }
    } catch (e) {
      setEvents((p) => [...p, { type: "error", message: String(e) }]);
    } finally {
      setRunning(false);
    }
  }

  const synthesis = events.find((e) => e.type === "synthesis") as Extract<Event, { type: "synthesis" }> | undefined;
  const plan = events.find((e) => e.type === "plan") as Extract<Event, { type: "plan" }> | undefined;
  const searches = events.filter((e) => e.type === "search") as Extract<Event, { type: "search" }>[];
  const fetches = events.filter((e) => e.type === "fetch") as Extract<Event, { type: "fetch" }>[];
  const errors = events.filter((e) => e.type === "error") as Extract<Event, { type: "error" }>[];

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto h-screen anim-fade-in">
        <PageHeader
          module="DEEP · RESEARCH"
          title="Multi-step inquiry"
          subtitle="Plan · search · fetch · synthesize · cite"
          icon={Search}
        />

        <section className="rounded-2xl border border-border bg-card/40 p-5 mb-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything — e.g. 'Compare the latest open-source agent frameworks and their tool-calling support.'"
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground">Pulls Tavily/Serper/Brave + your free LLM. Set <code>TAVILY_API_KEY</code>.</div>
            <button
              onClick={run}
              disabled={running || !query.trim()}
              className="px-4 py-2 rounded-lg praxon-gradient text-white text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {running ? "Researching…" : "Run research"}
            </button>
          </div>
        </section>

        {errors.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 mb-4">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{e.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {synthesis ? (
              <article className="rounded-2xl border border-border bg-card/40 p-7 anim-fade-up">
                <SynthesizedMarkdown markdown={synthesis.markdown} sources={synthesis.sources} />
              </article>
            ) : running ? (
              <div className="rounded-2xl border border-border bg-card/40 p-7">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing…
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center text-sm text-muted-foreground">
                Report appears here.
              </div>
            )}
          </div>

          <aside className="space-y-3">
            {plan && (
              <Box icon={ListChecks} title="Plan">
                <div className="text-xs text-muted-foreground mb-2">{plan.intent}</div>
                <ul className="space-y-1">
                  {plan.subqueries.map((q, i) => <li key={i} className="text-xs"><span className="text-accent">{i + 1}.</span> {q}</li>)}
                </ul>
              </Box>
            )}
            {searches.length > 0 && (
              <Box icon={Globe} title={`Searches (${searches.length})`}>
                {searches.map((s, i) => (
                  <details key={i} className="text-xs mb-1">
                    <summary className="cursor-pointer hover:text-accent truncate">{s.query}</summary>
                    <ul className="ml-3 mt-1 space-y-0.5">
                      {s.results.slice(0, 5).map((r, j) => (
                        <li key={j}><a className="text-muted-foreground hover:text-accent truncate inline-block max-w-full" href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>
                      ))}
                    </ul>
                  </details>
                ))}
              </Box>
            )}
            {fetches.length > 0 && (
              <Box icon={FileText} title={`Fetched (${fetches.filter((f) => f.ok).length}/${fetches.length})`}>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {fetches.slice(0, 12).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <span className={f.ok ? "text-accent" : "text-destructive"}>•</span>
                      <span className="truncate">{f.url}</span>
                    </div>
                  ))}
                </div>
              </Box>
            )}
            {synthesis && (
              <Box icon={ExternalLink} title="Sources">
                <ol className="text-xs space-y-1">
                  {synthesis.sources.map((s, i) => (
                    <li key={i} className="truncate">
                      <a className="hover:text-accent" href={s.url} target="_blank" rel="noreferrer">[{i + 1}] {s.title}</a>
                    </li>
                  ))}
                </ol>
              </Box>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function SynthesizedMarkdown({ markdown, sources }: { markdown: string; sources: { url: string; title: string }[] }) {
  // Replace [1], [2,3] patterns with anchor links
  const transformed = markdown.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_m, nums: string) => {
    return nums.split(",").map((n) => {
      const i = parseInt(n.trim(), 10);
      return `[[${i}]](#src-${i})`;
    }).join("");
  });
  return (
    <div className="prose prose-sm prose-invert max-w-none [&_a[href^='#src-']]:no-underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children, ...props }) => {
            if (href?.startsWith("#src-")) {
              const idx = parseInt(href.replace("#src-", ""), 10);
              const src = sources[idx - 1];
              return (
                <a
                  href={src?.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  title={src?.title ?? ""}
                  className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 mx-0.5 rounded bg-accent/15 hover:bg-accent/30 text-accent text-[10px] font-mono align-text-top no-underline transition-colors"
                  {...props}
                >
                  {String(children).replace(/[\[\]]/g, "")}
                </a>
              );
            }
            return <a className="text-accent hover:underline" target="_blank" rel="noreferrer" href={href} {...props}>{children}</a>;
          },
        }}
      >
        {transformed}
      </ReactMarkdown>
    </div>
  );
}

function Box({ icon: I, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <h3 className="font-medium text-sm flex items-center gap-2 mb-3"><I className="w-3.5 h-3.5 text-accent" /> {title}</h3>
      {children}
    </div>
  );
}
