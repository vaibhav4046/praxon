"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/page-header";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";

type Project = { id: string; name: string; description: string; updatedAt: number };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const r = await fetch("/api/projects");
    const j = await r.json();
    setProjects(j.projects ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setCreating(false);
    if (r.ok) {
      setName(""); setDescription("");
      toast.success("Project created");
      load();
    } else toast.error("Failed to create");
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 anim-fade-in">
        <PageHeader
          module="PROJECTS · WORKSPACES"
          title="Sandboxes"
          subtitle="Each project: isolated workspace, memory, backpack, skills"
          icon={FolderKanban}
        />

        <section className="mb-10 rounded-lg border border-border bg-card/40 p-5 max-w-xl">
          <h2 className="text-sm font-medium mb-3">New project</h2>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full mb-2 px-3 py-2 rounded border border-input bg-background text-sm"
          />
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full mb-3 px-3 py-2 rounded border border-input bg-background text-sm resize-none"
          />
          <button
            onClick={create}
            disabled={creating || !name.trim()}
            className="px-3 py-1.5 rounded praxon-gradient text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg border border-border bg-card/40 p-4 hover:border-accent/40 transition-colors">
              <div className="font-medium mb-1">{p.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{p.description || "—"}</div>
              <div className="mt-3 text-[10px] text-muted-foreground">Updated {new Date(p.updatedAt).toLocaleString()}</div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="text-sm text-muted-foreground">No projects yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
