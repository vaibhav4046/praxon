"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingNav } from "@/components/landing/nav";
import { Check, Copy, ExternalLink, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  { id: "groq", name: "Groq", desc: "Fastest free Llama 3.3 70B. Recommended.", url: "https://console.groq.com/keys", env: "GROQ_API_KEY", recommended: true },
  { id: "gemini", name: "Google Gemini", desc: "Gemini 2.0 Flash. Free tier with generous limits.", url: "https://aistudio.google.com/apikey", env: "GEMINI_API_KEY" },
  { id: "cerebras", name: "Cerebras", desc: "Insanely fast inference. Free tier available.", url: "https://cloud.cerebras.ai", env: "CEREBRAS_API_KEY" },
  { id: "together", name: "Together AI", desc: "Free tier on Llama 3.3 70B Turbo.", url: "https://api.together.xyz/settings/api-keys", env: "TOGETHER_API_KEY" },
  { id: "openrouter", name: "OpenRouter", desc: "Aggregator. Many free models in one place.", url: "https://openrouter.ai/keys", env: "OPENROUTER_API_KEY" },
  { id: "ollama", name: "Ollama (local)", desc: "100% local. No API key. Set OLLAMA_ENABLED=1.", url: "https://ollama.com", env: "OLLAMA_ENABLED" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState(PROVIDERS[0]);
  const [providers, setProviders] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const r = await fetch("/api/health");
    const j = await r.json();
    setProviders(j.providers ?? []);
  }
  useEffect(() => { refresh(); }, []);

  const ready = providers.length > 0;

  async function testChat() {
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Reply with exactly: Praxon ready." }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const reader = r.body!.getReader();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += new TextDecoder().decode(value);
      }
      if (acc.toLowerCase().includes("praxon")) {
        toast.success("Praxon is alive.");
        setStep(4);
      } else {
        toast.message("Got a response — looks good.");
        setStep(4);
      }
    } catch (e) {
      toast.error(`Test failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full anim-fade-in">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs text-accent mb-4">
            <Sparkles className="w-3 h-3" /> Setup · Step {step} of 4
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Get Praxon ready in 60 seconds.</h1>
        </div>

        <Stepper step={step} />

        {step === 1 && (
          <Card>
            <h2 className="text-lg font-medium mb-1">Pick a free provider</h2>
            <p className="text-sm text-muted-foreground mb-5">Praxon runs on free LLMs. Pick one (you can add more later).</p>
            <div className="grid gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPicked(p)}
                  className={`text-left rounded-lg border px-4 py-3 transition-colors ${picked.id === p.id ? "border-accent/60 bg-accent/5" : "border-border bg-card/40 hover:border-accent/30"}`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">{p.name}</span>
                    {p.recommended && <span className="text-[10px] uppercase tracking-wider text-accent">Recommended</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg praxon-gradient text-white text-sm">Continue</button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <h2 className="text-lg font-medium mb-1">Get your free key</h2>
            <p className="text-sm text-muted-foreground mb-5">Open the {picked.name} site, sign up, and create an API key. Free tier — no credit card needed.</p>
            <a href={picked.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-card/40 hover:border-accent/40 text-sm mb-5">
              Open {picked.name} <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {picked.id !== "ollama" ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Then paste this into <code className="px-1 py-0.5 rounded bg-muted text-foreground">praxon/.env.local</code> and restart the server:</p>
                <div className="flex items-center gap-2 mb-5">
                  <code className="flex-1 px-3 py-2 rounded border border-border bg-card/40 text-xs font-mono">{picked.env}=YOUR_KEY_HERE</code>
                  <button onClick={() => { navigator.clipboard.writeText(`${picked.env}=YOUR_KEY_HERE`); toast.success("Copied"); }} className="p-2 rounded border border-border hover:border-accent/40"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">Install Ollama, pull a model, then enable in <code className="px-1 py-0.5 rounded bg-muted text-foreground">praxon/.env.local</code>:</p>
                <pre className="text-xs font-mono px-3 py-2 rounded border border-border bg-card/40 mb-5 whitespace-pre-wrap">{`ollama pull llama3.1:8b
# .env.local
OLLAMA_ENABLED=1
OLLAMA_MODEL=llama3.1:8b`}</pre>
              </>
            )}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
              <button onClick={() => { refresh(); setStep(3); }} className="px-4 py-2 rounded-lg praxon-gradient text-white text-sm">I've added my key</button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h2 className="text-lg font-medium mb-1">Test the connection</h2>
            <p className="text-sm text-muted-foreground mb-5">Praxon detects providers automatically when you restart <code>pnpm dev</code>.</p>
            <div className="rounded-lg border border-border bg-card/40 p-4 mb-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Detected providers</div>
              {ready ? (
                <div className="flex flex-wrap gap-2">
                  {providers.map((p) => (
                    <span key={p.name} className="px-2 py-1 rounded bg-accent/10 border border-accent/30 text-xs text-accent">{p.name}</span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No providers detected yet. Restart <code>pnpm dev</code> after editing <code>.env.local</code>.</div>
              )}
              <button onClick={refresh} className="mt-3 text-xs text-accent hover:underline">Refresh</button>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
              <button
                onClick={testChat}
                disabled={!ready || loading}
                className="px-4 py-2 rounded-lg praxon-gradient text-white text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Run test chat
              </button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <div className="w-12 h-12 rounded-full praxon-gradient grid place-items-center mb-4 mx-auto"><Check className="w-6 h-6 text-white" /></div>
            <h2 className="text-xl font-medium mb-1 text-center">You're set.</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Praxon is ready to chat, code, research, and automate.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push("/chat")} className="rounded-lg praxon-gradient text-white p-4 text-left">
                <Zap className="w-4 h-4 mb-2 text-white" />
                <div className="font-medium text-sm">Open chat</div>
                <div className="text-[11px] text-white/80">Start talking to Praxon</div>
              </button>
              <Link href="/dashboard" className="rounded-lg border border-border bg-card/40 p-4 hover:border-accent/40">
                <Sparkles className="w-4 h-4 mb-2 text-accent" />
                <div className="font-medium text-sm">Dashboard</div>
                <div className="text-[11px] text-muted-foreground">Overview & quick actions</div>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={`h-1 w-12 rounded-full ${n <= step ? "praxon-gradient" : "bg-border"}`} />
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card/40 p-7">{children}</div>;
}
