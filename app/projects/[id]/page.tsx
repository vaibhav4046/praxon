import { Sidebar } from "@/components/sidebar";
import { ProjectShell } from "@/components/project/project-shell";
import { getProject } from "@/lib/db/projects";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) notFound();
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <ProjectShell projectId={p.id} projectName={p.name} />
      </main>
    </div>
  );
}
