"use client";
import { useState } from "react";
import { CodeWorkspace } from "@/components/code/code-workspace";
import { BackpackPanel } from "@/components/backpack/backpack-panel";
import { MemoryEditor } from "@/components/memory/memory-editor";
import { ChatView } from "@/components/chat/chat-view";
import { Code2, MessageSquare, Backpack, BookOpen, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "code", label: "Code", icon: Code2 },
  { id: "backpack", label: "Backpack", icon: Backpack },
  { id: "memory", label: "Memory", icon: BookOpen },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

type TabId = typeof TABS[number]["id"];

export function ProjectShell({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [tab, setTab] = useState<TabId>("chat");
  return (
    <div className="h-screen flex flex-col">
      <header className="px-5 py-2.5 border-b border-border flex items-center gap-3 bg-card/30">
        <span className="text-sm font-medium truncate">{projectName}</span>
        <span className="text-[10px] text-muted-foreground">{projectId}</span>
        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors",
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 min-h-0">
        {tab === "chat" && <ChatView projectId={projectId} />}
        {tab === "code" && <CodeWorkspace projectId={projectId} />}
        {tab === "backpack" && (
          <div className="p-6 max-w-3xl mx-auto"><BackpackPanel projectId={projectId} /></div>
        )}
        {tab === "memory" && (
          <div className="p-6 max-w-3xl mx-auto"><MemoryEditor projectId={projectId} /></div>
        )}
        {tab === "settings" && <ProjectSettings projectId={projectId} />}
      </div>
    </div>
  );
}

function ProjectSettings({ projectId }: { projectId: string }) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="rounded-xl border border-border bg-card/40 p-5">
        <h2 className="font-medium mb-3">Project</h2>
        <p className="text-sm text-muted-foreground">Project ID: <code className="text-foreground">{projectId}</code></p>
        <p className="text-xs text-muted-foreground mt-2">More settings coming — system prompt editor, tool whitelist, default provider.</p>
      </div>
    </div>
  );
}
