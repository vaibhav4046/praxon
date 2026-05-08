"use client";
import { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { FileTree, type TreeNode } from "./file-tree";
import { CodeEditor } from "./code-editor";
import { Terminal } from "./terminal";
import { ChatView } from "../chat/chat-view";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function CodeWorkspace({ projectId }: { projectId: string }) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [content, setContent] = useState<string>("");
  const [dirty, setDirty] = useState(false);

  async function loadTree() {
    const r = await fetch(`/api/workspace/${projectId}/files`);
    const j = await r.json();
    setTree(j.tree ?? []);
  }
  async function loadFile(p: string) {
    const r = await fetch(`/api/workspace/${projectId}/file?path=${encodeURIComponent(p)}`);
    const j = await r.json();
    setContent(j.content ?? "");
    setSelected(p);
    setDirty(false);
  }
  async function save() {
    if (!selected) return;
    const r = await fetch(`/api/workspace/${projectId}/file`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected, content }),
    });
    if (r.ok) { setDirty(false); toast.success("Saved"); } else toast.error("Save failed");
  }

  useEffect(() => { loadTree(); }, [projectId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <PanelGroup direction="horizontal" className="h-screen">
      <Panel defaultSize={16} minSize={10}>
        <div className="h-full border-r border-border bg-card/30 flex flex-col">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Files</span>
            <button onClick={loadTree} className="text-[10px] text-muted-foreground hover:text-foreground">refresh</button>
          </div>
          <div className="flex-1 overflow-auto">
            <FileTree tree={tree} onSelect={loadFile} selected={selected} />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className="w-px bg-border" />
      <Panel defaultSize={52} minSize={30}>
        <PanelGroup direction="vertical" className="h-full">
          <Panel defaultSize={70} minSize={20}>
            <div className="h-full flex flex-col">
              <div className="px-3 py-1.5 border-b border-border flex items-center justify-between bg-card/30">
                <span className="text-xs text-muted-foreground truncate">
                  {selected ?? "Select a file"}{dirty ? " •" : ""}
                </span>
                <button
                  onClick={save}
                  disabled={!selected || !dirty}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/70 disabled:opacity-40"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
              <div className="flex-1">
                {selected ? (
                  <CodeEditor
                    path={selected}
                    value={content}
                    onChange={(v) => { setContent(v); setDirty(true); }}
                  />
                ) : (
                  <div className="h-full grid place-items-center text-muted-foreground text-sm">No file selected.</div>
                )}
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="h-px bg-border" />
          <Panel defaultSize={30} minSize={10}>
            <Terminal projectId={projectId} />
          </Panel>
        </PanelGroup>
      </Panel>
      <PanelResizeHandle className="w-px bg-border" />
      <Panel defaultSize={32} minSize={20}>
        <ChatView projectId={projectId} />
      </Panel>
    </PanelGroup>
  );
}
