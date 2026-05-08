"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Message, type ChatMsg } from "./message";
import { Composer } from "./composer";
import { ChatHeader } from "./chat-header";
import { Sparkles } from "lucide-react";

type Provider = { name: string; free: boolean; local: boolean };
type Skill = { id: string; name: string; description: string };

export function ChatView({ projectId }: { projectId?: string | null } = {}) {
  const search = useSearchParams();
  const router = useRouter();
  const sessionId = search.get("session");

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillId, setSkillId] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ownNavRef = useRef<string | null>(null); // track sessionIds we created locally

  useEffect(() => {
    fetch("/api/providers").then((r) => r.json()).then((d) => {
      setProviders(d.providers ?? []);
      if (d.providers?.[0]) setProvider(d.providers[0].name);
      if (!d.providers || d.providers.length === 0) {
        router.replace("/onboarding");
      }
    });
    fetch("/api/skills").then((r) => r.json()).then((d) => setSkills(d.skills ?? []));
  }, [router]);

  // Load existing session — but skip if user is mid-stream in a session we just created
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    // Skip refetch if we just navigated to this session via our own router.replace
    if (ownNavRef.current === sessionId) {
      ownNavRef.current = null;
      return;
    }
    fetch(`/api/sessions/${sessionId}`).then((r) => r.json()).then((d) => {
      if (d?.session?.messages) {
        setMessages(d.session.messages.map((m: ChatMsg & { role: string }) => ({
          id: m.id, role: m.role as ChatMsg["role"],
          content: m.content, toolCalls: m.toolCalls, provider: m.provider,
        })));
      }
    });
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string, attempt = 0) => {
    const isRetry = attempt > 0;
    if (!isRetry) {
      const userMsg: ChatMsg = { id: `tmp-u-${Date.now()}`, role: "user", content: text };
      const asstMsg: ChatMsg = { id: `tmp-a-${Date.now()}`, role: "assistant", content: "", provider, streaming: true };
      setMessages((m) => [...m, userMsg, asstMsg]);
    } else {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { ...next[next.length - 1], content: "", streaming: true };
        return next;
      });
    }
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    let sawError = false;
    let sawContent = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          projectId: projectId ?? null,
          message: text,
          preferredProvider: provider,
          skillId,
        }),
        signal: ac.signal,
      });
      const newSessionId = res.headers.get("X-Praxon-Session");
      const usedProvider = res.headers.get("X-Praxon-Provider") ?? provider;
      if (newSessionId && newSessionId !== sessionId) {
        ownNavRef.current = newSessionId;
        const params = new URLSearchParams(search.toString());
        params.set("session", newSessionId);
        router.replace(`?${params.toString()}`);
      }
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        // ai-sdk data stream: lines like `0:"text"`, `9:{...toolcall}`, `e:{...}`
        for (const line of chunk.split("\n")) {
          if (!line) continue;
          const i = line.indexOf(":");
          if (i < 0) continue;
          const tag = line.slice(0, i);
          const json = line.slice(i + 1);
          try {
            if (tag === "0") {
              sawContent = true;
              acc += JSON.parse(json) as string;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { ...next[next.length - 1], content: acc, provider: usedProvider ?? undefined };
                return next;
              });
            } else if (tag === "9") {
              const tc = JSON.parse(json) as { toolCallId: string; toolName: string; args: Record<string, unknown> };
              setMessages((m) => {
                const next = [...m];
                const last = { ...next[next.length - 1] };
                last.toolCalls = [...(last.toolCalls ?? []), { id: tc.toolCallId, name: tc.toolName, args: tc.args }];
                next[next.length - 1] = last;
                return next;
              });
            } else if (tag === "3") {
              sawError = true;
              const errMsg = JSON.parse(json) as string;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: (acc || "") + `\n\n⚠️ **Provider error:** ${errMsg}`,
                  streaming: false,
                };
                return next;
              });
            }
          } catch { /* tolerate partial chunks */ }
        }
      }
    } catch (e) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { ...next[next.length - 1], content: `_Error: ${e instanceof Error ? e.message : String(e)}_`, streaming: false };
        return next;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          // If stream ended with no content, surface friendly error
          const noContent = !last.content && !(last.toolCalls && last.toolCalls.length > 0);
          if (noContent) {
            next[next.length - 1] = {
              ...last,
              streaming: false,
              content: `⚠️ The provider returned no content. ${sawError ? "Tool-calling failed mid-stream — common Groq glitch." : "Auto-retrying..."}\n\n**Fix:** add a 2nd provider in [Settings](/settings) (Anthropic, OpenAI, Gemini) for automatic fallback.`,
            };
          } else {
            next[next.length - 1] = { ...last, streaming: false };
          }
        }
        return next;
      });
    }
    // Auto-retry once if no content was streamed (covers both error frame + silent fail)
    if (!sawContent && attempt < 1) {
      await new Promise((r) => setTimeout(r, 800));
      void send(text, attempt + 1);
    }
  }, [provider, projectId, router, search, sessionId, skillId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const lastAsstWithProvider = [...messages].reverse().find((m) => m.role === "assistant" && m.provider);
  const providerLabel = lastAsstWithProvider?.provider ?? provider;

  async function regenerate() {
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx < 0) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    const userMsg = messages[realIdx];
    if (!userMsg) return;
    setMessages((m) => m.slice(0, realIdx + 1));
    await send(userMsg.content);
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader sessionId={sessionId} providerLabel={providerLabel} />
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 ? (
          <Empty providerCount={providers.length} />
        ) : (
          <div className="max-w-3xl mx-auto py-6">
            {messages.map((m, i) => (
              <Message
                key={m.id}
                m={m}
                onRegenerate={i === messages.length - 1 && m.role === "assistant" && !busy ? regenerate : undefined}
              />
            ))}
          </div>
        )}
      </div>
      <Composer
        onSend={send}
        onStop={stop}
        busy={busy}
        provider={provider}
        setProvider={setProvider}
        providers={providers}
        skills={skills}
        skillId={skillId}
        setSkillId={setSkillId}
      />
    </div>
  );
}

function Empty({ providerCount }: { providerCount: number }) {
  const cards = [
    { title: "Build a Next.js app", body: "Set up a starter, add a feature, run it locally — all in this workspace." },
    { title: "Research the agent space", body: "Multi-step web research with citations. Try /research." },
    { title: "Summarize a long article", body: "Drop a URL and get the key points back." },
    { title: "Automate a daily digest", body: "Schedule a routine that runs every morning at 8am." },
  ];
  return (
    <div className="h-full grid place-items-center px-6">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs text-accent mb-6">
          <Sparkles className="w-3 h-3" /> Open-source · Free LLMs · Local-first
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
          What should <span className="text-gradient">Praxon</span> do?
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
          Chat, code, research, browse, or run a multi-step agent — all from one place.
          {providerCount === 0 && <> <a href="/onboarding" className="text-accent hover:underline">Set up your free LLM →</a></>}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
          {cards.map((c) => (
            <div key={c.title} className="px-4 py-3 rounded-xl border border-border bg-card/40 hover:border-accent/40 transition-colors cursor-pointer">
              <div className="text-sm font-medium mb-0.5">{c.title}</div>
              <div className="text-xs text-muted-foreground">{c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
