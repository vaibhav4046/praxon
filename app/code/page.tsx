import { Sidebar } from "@/components/sidebar";
import { CodeWorkspace } from "@/components/code/code-workspace";
import { listProjects, createProject } from "@/lib/db/projects";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function CodePage() {
  const projects = listProjects();
  const project = projects[0] ?? (await createProject({ name: "Default", description: "Default workspace" }));
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Suspense fallback={<div className="h-screen grid place-items-center text-muted-foreground">Loading…</div>}>
          <CodeWorkspace projectId={project.id} />
        </Suspense>
      </main>
    </div>
  );
}
