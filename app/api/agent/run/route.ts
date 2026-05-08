import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agents/orchestrator";
import { ensureWorkspace } from "@/lib/db/store";
import { createProject, getProject, listProjects } from "@/lib/db/projects";
import { getSkill } from "@/lib/db/skills";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { prompt, projectId, skillId, preferredProvider } = await req.json();
  if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });
  let project = projectId ? getProject(projectId) : listProjects()[0];
  if (!project) project = await createProject({ name: "Default", description: "Auto-created default project" });
  const ws = project.workspacePath ?? (await ensureWorkspace(project.id));

  let systemPrompt: string | undefined;
  let enabledTools: string[] | undefined;
  if (skillId) {
    const s = getSkill(skillId);
    if (s) {
      systemPrompt = s.systemPrompt;
      enabledTools = s.toolWhitelist.length > 0 ? s.toolWhitelist : undefined;
    }
  }

  const { result, provider } = await runAgent({
    messages: [{ role: "user", content: prompt }],
    systemPrompt,
    preferredProvider,
    enabledTools,
    toolContext: { projectId: project.id, workspacePath: ws, sessionId: `oneshot-${Date.now()}` },
    maxSteps: 8,
  });
  const text = await result.text;
  return Response.json({ text, provider });
}
