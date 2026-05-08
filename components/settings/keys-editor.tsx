"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Key, Save, Trash2, Sparkles } from "lucide-react";

type Provider = { name: string; free: boolean; local: boolean };

const KEY_GROUPS = [
  {
    label: "Premium (best quality)",
    keys: [
      { name: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", url: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-..." },
      { name: "OPENAI_API_KEY", label: "OpenAI (GPT-4)", url: "https://platform.openai.com/api-keys", placeholder: "sk-..." },
    ],
  },
  {
    label: "Free providers",
    keys: [
      { name: "GROQ_API_KEY", label: "Groq (free Llama 3.3 70B)", url: "https://console.groq.com/keys", placeholder: "gsk_..." },
      { name: "GEMINI_API_KEY", label: "Google Gemini (free)", url: "https://aistudio.google.com/apikey", placeholder: "AIza..." },
      { name: "CEREBRAS_API_KEY", label: "Cerebras (free, fast)", url: "https://cloud.cerebras.ai", placeholder: "csk-..." },
      { name: "TOGETHER_API_KEY", label: "Together AI (free)", url: "https://api.together.xyz/settings/api-keys", placeholder: "..." },
      { name: "OPENROUTER_API_KEY", label: "OpenRouter (free models)", url: "https://openrouter.ai/keys", placeholder: "sk-or-..." },
    ],
  },
  {
    label: "Web search (for Deep Research)",
    keys: [
      { name: "TAVILY_API_KEY", label: "Tavily (free 1000/mo)", url: "https://app.tavily.com", placeholder: "tvly-..." },
      { name: "SERPER_API_KEY", label: "Serper", url: "https://serper.dev", placeholder: "..." },
      { name: "BRAVE_SEARCH_API_KEY", label: "Brave Search", url: "https://api.search.brave.com", placeholder: "..." },
    ],
  },
];

export function KeysEditor() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/keys");
    const j = await r.json();
    setKeys(j.keys ?? {});
    setProviders(j.providers ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save(name: string) {
    const value = edits[name];
    if (!value) return;
    setSaving(name);
    try {
      const r = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: name, value }),
      });
      if (r.ok) {
        toast.success(`${name} saved — providers active immediately.`);
        setEdits((e) => { const n = { ...e }; delete n[name]; return n; });
        load();
      } else {
        const j = await r.json();
        toast.error(j.error ?? "Failed");
      }
    } finally { setSaving(null); }
  }

  async function remove(name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    const r = await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: name }),
    });
    if (r.ok) { toast.success("Removed"); load(); } else toast.error("Failed");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-medium mb-1">Active providers ({providers.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {providers.length === 0 ? (
              <span className="text-muted-foreground text-xs">None — add a key below to get started.</span>
            ) : providers.map((p) => (
              <span key={p.name} className="px-2 py-0.5 rounded bg-accent/15 text-accent text-[11px] border border-accent/30">
                {p.name}{p.local ? " · local" : p.free ? " · free" : " · premium"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {KEY_GROUPS.map((group) => (
        <section key={group.label}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{group.label}</h3>
          <div className="space-y-2">
            {group.keys.map((k) => {
              const current = keys[k.name] ?? "";
              const editing = edits[k.name] !== undefined;
              const visible = reveal[k.name];
              return (
                <div key={k.name} className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-sm">{k.label}</span>
                      {current && !editing && <span className="text-[10px] text-accent px-1.5 py-0.5 rounded bg-accent/10">configured</span>}
                    </div>
                    <a href={k.url} target="_blank" rel="noreferrer" className="text-[11px] text-accent hover:underline">Get key →</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type={visible ? "text" : "password"}
                      value={editing ? edits[k.name] : current}
                      onChange={(e) => setEdits((m) => ({ ...m, [k.name]: e.target.value }))}
                      placeholder={k.placeholder}
                      className="flex-1 px-3 py-1.5 rounded border border-input bg-background text-xs font-mono"
                    />
                    <button
                      onClick={() => setReveal((m) => ({ ...m, [k.name]: !visible }))}
                      className="p-2 rounded border border-border hover:border-accent/40"
                      type="button"
                      title={visible ? "Hide" : "Show"}
                    >
                      {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {editing && (
                      <button
                        onClick={() => save(k.name)}
                        disabled={saving === k.name}
                        className="px-3 py-1.5 rounded praxon-gradient text-white text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" /> {saving === k.name ? "Saving…" : "Save"}
                      </button>
                    )}
                    {current && !editing && (
                      <button
                        onClick={() => remove(k.name)}
                        className="p-2 rounded border border-border hover:border-destructive/40 hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
