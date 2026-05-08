"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Skill = { id: string; name: string; description: string; trigger: string; systemPrompt: string };

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState({ name: "", description: "", trigger: "", systemPrompt: "" });

  async function load() {
    const r = await fetch("/api/skills"); const j = await r.json();
    setSkills(j.skills ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.systemPrompt) { toast.error("Name & system prompt required"); return; }
    const r = await fetch("/api/skills", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) { toast.success("Skill created"); setForm({ name: "", description: "", trigger: "", systemPrompt: "" }); load(); }
    else toast.error("Failed");
  }

  async function remove(id: string) {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 anim-fade-in">
        <PageHeader
          module="SKILLS · REGISTRY"
          title="Reusable prompts"
          subtitle="Trigger by phrase or call directly · per-skill tool whitelist"
          icon={Sparkles}
        />

        <section className="mb-10 rounded-lg border border-border bg-card/40 p-5 max-w-2xl">
          <h2 className="text-sm font-medium mb-3">New skill</h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. code-review)" className="px-3 py-2 rounded border border-input bg-background text-sm" />
            <input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} placeholder="Trigger phrase (optional)" className="px-3 py-2 rounded border border-input bg-background text-sm" />
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full mb-2 px-3 py-2 rounded border border-input bg-background text-sm" />
          <textarea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} placeholder="System prompt — what behavior to invoke" rows={5} className="w-full mb-3 px-3 py-2 rounded border border-input bg-background text-sm font-mono" />
          <button onClick={create} className="px-3 py-1.5 rounded praxon-gradient text-white text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create</button>
        </section>

        <section className="grid gap-3 max-w-3xl">
          {skills.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card/40 p-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">{s.name}</span>
                  {s.trigger && <span className="text-xs text-accent">/{s.trigger}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
                <pre className="mt-2 text-[11px] font-mono text-muted-foreground/80 line-clamp-2">{s.systemPrompt}</pre>
              </div>
              <button onClick={() => remove(s.id)} className="p-2 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {skills.length === 0 && <div className="text-sm text-muted-foreground">No skills yet.</div>}
        </section>
      </main>
    </div>
  );
}
