"use client";
import { useEffect, useState } from "react";
import { Backpack, FileText, Pin, PinOff, Plus, Trash2, Upload, StickyNote } from "lucide-react";
import { toast } from "sonner";

type Item = {
  id: string; name: string; kind: "file" | "note"; path: string;
  size: number; mime?: string; preview: string; pinned: boolean; createdAt: number;
};

export function BackpackPanel({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [showNote, setShowNote] = useState(false);
  const [noteName, setNoteName] = useState("");
  const [noteContent, setNoteContent] = useState("");

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/backpack`);
    const j = await r.json();
    setItems(j.items ?? []);
  }
  useEffect(() => { load(); }, [projectId]);

  async function uploadFiles(files: FileList | File[]) {
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`/api/projects/${projectId}/backpack`, { method: "POST", body: fd });
      if (!r.ok) toast.error(`Upload failed: ${f.name}`);
    }
    toast.success("Added to backpack");
    load();
  }

  async function addNote() {
    if (!noteContent.trim()) return;
    const r = await fetch(`/api/projects/${projectId}/backpack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: noteName || "Note", content: noteContent }),
    });
    if (r.ok) { toast.success("Note saved"); setShowNote(false); setNoteName(""); setNoteContent(""); load(); }
    else toast.error("Failed");
  }

  async function togglePin(id: string, pinned: boolean) {
    await fetch(`/api/projects/${projectId}/backpack/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/projects/${projectId}/backpack/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium flex items-center gap-2"><Backpack className="w-4 h-4 text-accent" /> Backpack</h2>
        <div className="flex gap-1.5">
          <label className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-accent/40 text-xs">
            <Upload className="w-3 h-3" /> Upload
            <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <button onClick={() => setShowNote((s) => !s)} className="flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-accent/40 text-xs">
            <StickyNote className="w-3 h-3" /> Note
          </button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        Pinned items get auto-injected into every chat in this project. Drop files, paste notes — Praxon remembers.
      </div>

      {showNote && (
        <div className="rounded-lg border border-border bg-background/40 p-3 mb-3">
          <input
            value={noteName} onChange={(e) => setNoteName(e.target.value)}
            placeholder="Note title (optional)"
            className="w-full mb-2 px-3 py-2 rounded border border-input bg-background text-sm"
          />
          <textarea
            value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Paste anything — research, instructions, code snippets, references…"
            rows={5}
            className="w-full mb-2 px-3 py-2 rounded border border-input bg-background text-sm font-mono"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNote(false)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={addNote} className="px-3 py-1 rounded praxon-gradient text-white text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Add note</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
            Nothing in the backpack yet. Add files or notes — they ride along with every chat.
          </div>
        ) : items.map((i) => (
          <div key={i.id} className="rounded-lg border border-border bg-background/30 p-3 flex items-start gap-2.5">
            {i.kind === "note" ? <StickyNote className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" /> : <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{i.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {(i.size / 1024).toFixed(1)} KB · {i.mime ?? "binary"}
              </div>
              <div className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-1 font-mono">{i.preview}</div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => togglePin(i.id, !i.pinned)} className={`p-1 rounded ${i.pinned ? "text-accent" : "text-muted-foreground/50 hover:text-accent"}`} title={i.pinned ? "Pinned (in context)" : "Not pinned"}>
                {i.pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>
              <button onClick={() => remove(i.id)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
