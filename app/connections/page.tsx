"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import { Plug, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Server = { id: string; name: string; command: string; args: string[]; env: Record<string, string>; enabled: boolean };
type Provider = { name: string; free: boolean; local: boolean };

export default function ConnectionsPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState({ name: "", command: "", args: "", env: "" });

  async function load() {
    const [a, b] = await Promise.all([fetch("/api/mcp"), fetch("/api/providers")]);
    setServers((await a.json()).servers ?? []);
    setProviders((await b.json()).providers ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.command) { toast.error("Name & command required"); return; }
    let env: Record<string, string> = {};
    try { env = form.env.trim() ? JSON.parse(form.env) : {}; } catch { toast.error("env must be JSON"); return; }
    const args = form.args.split(/\s+/).filter(Boolean);
    const r = await fetch("/api/mcp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, command: form.command, args, env }),
    });
    if (r.ok) { toast.success("MCP server added"); setForm({ name: "", command: "", args: "", env: "" }); load(); }
    else toast.error("Failed");
  }
  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/mcp/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/mcp/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 anim-fade-in">
        <PageHeader
          module="CONNECTIONS · MCP"
          title="Integrations"
          subtitle="LLM providers + Model Context Protocol servers"
          icon={Plug}
        />

        <section className="mb-10">
          <h2 className="text-sm font-medium mb-3">Available LLM providers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl">
            {providers.map((p) => (
              <div key={p.name} className="rounded-lg border border-border bg-card/40 p-3">
                <div className="font-medium text-sm capitalize">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">{p.local ? "local" : "free api"}</div>
              </div>
            ))}
            {providers.length === 0 && <div className="text-sm text-muted-foreground">No providers configured. Set GROQ_API_KEY, GEMINI_API_KEY, TOGETHER_API_KEY, CEREBRAS_API_KEY, or run Ollama locally.</div>}
          </div>
        </section>

        <section className="mb-10 rounded-lg border border-border bg-card/40 p-5 max-w-2xl">
          <h2 className="text-sm font-medium mb-3">Add MCP server</h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. github)" className="px-3 py-2 rounded border border-input bg-background text-sm" />
            <input value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} placeholder="Command (e.g. npx)" className="px-3 py-2 rounded border border-input bg-background text-sm font-mono" />
          </div>
          <input value={form.args} onChange={(e) => setForm({ ...form, args: e.target.value })} placeholder="Args (space-separated)" className="w-full mb-2 px-3 py-2 rounded border border-input bg-background text-sm font-mono" />
          <textarea value={form.env} onChange={(e) => setForm({ ...form, env: e.target.value })} placeholder='Env JSON (e.g. {"GITHUB_TOKEN":"ghp_…"})' rows={2} className="w-full mb-3 px-3 py-2 rounded border border-input bg-background text-sm font-mono" />
          <button onClick={create} className="px-3 py-1.5 rounded praxon-gradient text-white text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</button>
        </section>

        <section className="grid gap-3 max-w-3xl">
          {servers.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card/40 p-4 flex items-center gap-3">
              <input type="checkbox" checked={s.enabled} onChange={(e) => toggle(s.id, e.target.checked)} className="accent-accent" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{s.command} {s.args.join(" ")}</div>
              </div>
              <button onClick={() => remove(s.id)} className="p-2 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {servers.length === 0 && <div className="text-sm text-muted-foreground">No MCP servers connected. Add Slack, GitHub, Notion, Gmail, Linear, etc.</div>}
        </section>
      </main>
    </div>
  );
}
