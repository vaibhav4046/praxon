"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit2, Trash2, Check, X, Share2, MoreHorizontal, Copy } from "lucide-react";
import { toast } from "sonner";

export function ChatHeader({ sessionId, providerLabel }: { sessionId: string | null; providerLabel?: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) { setTitle(""); return; }
    fetch(`/api/sessions/${sessionId}`).then((r) => r.json()).then((d) => setTitle(d?.session?.title ?? ""));
  }, [sessionId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    }
    if (menu) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menu]);

  async function saveTitle() {
    if (!sessionId || !draft.trim()) { setEditing(false); return; }
    const r = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft.trim() }),
    });
    if (r.ok) { setTitle(draft.trim()); setEditing(false); toast.success("Renamed"); }
    else toast.error("Failed");
  }

  async function deleteSession() {
    if (!sessionId) return;
    if (!confirm("Delete this conversation?")) return;
    const r = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Deleted");
      const params = new URLSearchParams(search.toString());
      params.delete("session");
      router.replace(`/chat${params.toString() ? `?${params}` : ""}`);
      router.refresh();
    } else toast.error("Failed");
  }

  function copyLink() {
    if (!sessionId) return;
    const url = `${window.location.origin}/chat?session=${sessionId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  if (!sessionId) {
    return (
      <header className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between bg-card/20 backdrop-blur">
        <div className="text-sm font-medium text-muted-foreground">New chat</div>
        {providerLabel && <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">{providerLabel}</span>}
      </header>
    );
  }

  return (
    <header className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between bg-card/20 backdrop-blur gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {editing ? (
          <>
            <input
              autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 min-w-0 px-2 py-1 rounded border border-input bg-background text-sm"
            />
            <button onClick={saveTitle} className="p-1 rounded hover:bg-accent/15 text-accent"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-accent/15"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium truncate">{title || "Untitled"}</span>
            <button
              onClick={() => { setDraft(title); setEditing(true); }}
              className="p-1 rounded hover:bg-accent/15 text-muted-foreground hover:text-foreground"
              title="Rename"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {providerLabel && <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 mr-1">{providerLabel}</span>}
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenu((m) => !m)} className="p-1.5 rounded hover:bg-accent/15"><MoreHorizontal className="w-4 h-4" /></button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-border bg-popover shadow-lg overflow-hidden min-w-[160px] anim-scale-in">
              <button onClick={() => { copyLink(); setMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 text-left">
                <Copy className="w-3.5 h-3.5" /> Copy link
              </button>
              <button onClick={() => { setMenu(false); window.open(`/chat?session=${sessionId}`, "_blank"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 text-left">
                <Share2 className="w-3.5 h-3.5" /> Open in new tab
              </button>
              <button onClick={() => { setMenu(false); deleteSession(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive text-left">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
