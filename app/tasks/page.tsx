"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Task = { id: string; name: string; cron: string; prompt: string; enabled: boolean; lastRun: number | null; projectId: string | null };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ name: "", cron: "0 9 * * *", prompt: "" });

  async function load() {
    const r = await fetch("/api/tasks"); const j = await r.json();
    setTasks(j.tasks ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.cron || !form.prompt) { toast.error("All fields required"); return; }
    const r = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) { toast.success("Task scheduled"); setForm({ name: "", cron: "0 9 * * *", prompt: "" }); load(); }
    else toast.error("Failed");
  }
  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 anim-fade-in">
        <PageHeader
          module="ROUTINES · CRON"
          title="Background agents"
          subtitle="Fire-and-forget automation · cron-scheduled prompts"
          icon={Clock}
        />

        <section className="mb-10 rounded-lg border border-border bg-card/40 p-5 max-w-2xl">
          <h2 className="text-sm font-medium mb-3">New task</h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Task name" className="px-3 py-2 rounded border border-input bg-background text-sm" />
            <input value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })} placeholder="Cron (e.g. 0 9 * * *)" className="px-3 py-2 rounded border border-input bg-background text-sm font-mono" />
          </div>
          <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Prompt to run" rows={3} className="w-full mb-3 px-3 py-2 rounded border border-input bg-background text-sm" />
          <button onClick={create} className="px-3 py-1.5 rounded praxon-gradient text-white text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Schedule</button>
        </section>

        <section className="grid gap-3 max-w-3xl">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card/40 p-4 flex items-center gap-3">
              <input
                type="checkbox" checked={t.enabled}
                onChange={(e) => toggle(t.id, e.target.checked)}
                className="accent-accent"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground"><code>{t.cron}</code> — last run: {t.lastRun ? new Date(t.lastRun).toLocaleString() : "never"}</div>
                <div className="text-xs text-muted-foreground/80 truncate">{t.prompt}</div>
              </div>
              <button onClick={() => remove(t.id)} className="p-2 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks yet.</div>}
        </section>
      </main>
    </div>
  );
}
