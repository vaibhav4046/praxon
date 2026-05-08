"use client";
import { useEffect, useState } from "react";
import { BookOpen, Save } from "lucide-react";
import { toast } from "sonner";

export function MemoryEditor({ projectId }: { projectId: string }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/memory`);
    const j = await r.json();
    setContent(j.content ?? "");
    setDirty(false);
  }
  useEffect(() => { load(); }, [projectId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/memory`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (r.ok) { toast.success("Memory saved"); setDirty(false); }
      else toast.error("Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Memory</h2>
        <button
          onClick={save} disabled={saving || !dirty}
          className="flex items-center gap-1 px-2 py-1 rounded praxon-gradient text-white text-xs disabled:opacity-50"
        >
          <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save"}{dirty && !saving ? " *" : ""}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Persistent facts the agent should always remember in this project. Auto-injected into every chat. Markdown supported.
      </p>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true); }}
        placeholder="- User prefers TypeScript over JavaScript&#10;- Project uses Next.js 15 + Tailwind&#10;- Always run `pnpm typecheck` before saying done"
        rows={10}
        className="w-full px-3 py-2 rounded border border-input bg-background text-sm font-mono resize-y"
      />
    </div>
  );
}
