import "server-only";
import cron, { type ScheduledTask as Job } from "node-cron";
import { listTasks, markTaskRun } from "../db/tasks";
import { createSession, appendMessage } from "../db/sessions";
import { getProject, createProject } from "../db/projects";
import { runAgent } from "../agents/orchestrator";
import { ensureWorkspace } from "../db/sqlite";

const jobs = new Map<string, Job>();

async function execTask(taskId: string, prompt: string, projectId: string | null) {
  let project = projectId ? getProject(projectId) : null;
  if (!project) project = await createProject({ name: "Scheduled", description: "Auto-created for scheduled tasks" });
  const ws = project.workspacePath ?? (await ensureWorkspace(project.id));
  const session = await createSession({ projectId: project.id, title: `cron: ${taskId}` });
  await appendMessage(session.id, { role: "user", content: prompt, toolCalls: [], attachments: [] });
  try {
    const { result, provider } = await runAgent({
      messages: [{ role: "user", content: prompt }],
      toolContext: { projectId: project.id, workspacePath: ws, sessionId: session.id },
      maxSteps: 8,
    });
    const text = await result.text;
    await appendMessage(session.id, { role: "assistant", content: text, toolCalls: [], attachments: [], provider, model: provider });
    await markTaskRun(taskId);
  } catch (e) {
    await appendMessage(session.id, {
      role: "assistant",
      content: `Task failed: ${e instanceof Error ? e.message : String(e)}`,
      toolCalls: [], attachments: [],
    });
  }
}

export function startScheduler() {
  syncJobs();
  // Re-sync every minute to pick up DB changes
  setInterval(syncJobs, 60_000);
}

export function syncJobs() {
  const tasks = listTasks();
  const seen = new Set<string>();
  for (const t of tasks) {
    seen.add(t.id);
    const existing = jobs.get(t.id);
    if (!t.enabled) {
      existing?.stop();
      jobs.delete(t.id);
      continue;
    }
    if (existing) continue;
    if (!cron.validate(t.cron)) continue;
    const job = cron.schedule(t.cron, () => {
      execTask(t.id, t.prompt, t.projectId).catch(() => {});
    });
    jobs.set(t.id, job);
  }
  // remove deleted
  for (const id of jobs.keys()) {
    if (!seen.has(id)) {
      jobs.get(id)!.stop();
      jobs.delete(id);
    }
  }
}
