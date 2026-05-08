"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, File as FileIcon, Folder, FolderOpen } from "lucide-react";

export type TreeNode = { name: string; path: string; type: "dir" | "file"; children?: TreeNode[] };

export function FileTree({ tree, onSelect, selected }: {
  tree: TreeNode[]; onSelect: (path: string) => void; selected?: string;
}) {
  return (
    <div className="text-sm">
      {tree.map((n) => <Node key={n.path} node={n} depth={0} onSelect={onSelect} selected={selected} />)}
    </div>
  );
}

function Node({ node, depth, onSelect, selected }: { node: TreeNode; depth: number; onSelect: (p: string) => void; selected?: string }) {
  const [open, setOpen] = useState(depth < 1);
  const pad = { paddingLeft: 8 + depth * 12 };
  if (node.type === "file") {
    const active = selected === node.path;
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center gap-1.5 py-1 hover:bg-accent/10 text-left truncate ${active ? "bg-accent/15 text-foreground" : "text-muted-foreground"}`}
        style={pad}
      >
        <FileIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate text-xs">{node.name}</span>
      </button>
    );
  }
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1 py-1 hover:bg-accent/10 text-left text-muted-foreground"
        style={pad}
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {open ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
        <span className="truncate text-xs">{node.name}</span>
      </button>
      {open && node.children?.map((c) => (
        <Node key={c.path} node={c} depth={depth + 1} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}
