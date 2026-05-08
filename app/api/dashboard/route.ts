import { listProjects } from "@/lib/db/projects";
import { listSessions } from "@/lib/db/sessions";
import { listSkills } from "@/lib/db/skills";
import { listTasks } from "@/lib/db/tasks";
import { availableProviders } from "@/lib/llm/router";
import { messagesStore } from "@/lib/db/store";

export const runtime = "nodejs";

export async function GET() {
  const projects = listProjects();
  const sessions = listSessions(undefined, 10);
  const skills = listSkills();
  const tasks = listTasks();
  const providers = availableProviders().map((p) => ({ name: p.name, free: p.free, local: p.local }));
  const messages = messagesStore.readSync();
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = messages.filter((m) => m.createdAt >= since);
  const userMsgs = recent.filter((m) => m.role === "user").length;
  const asstMsgs = recent.filter((m) => m.role === "assistant").length;
  const providerCounts: Record<string, number> = {};
  for (const m of recent) {
    if (m.provider) providerCounts[m.provider] = (providerCounts[m.provider] ?? 0) + 1;
  }
  return Response.json({
    counts: {
      projects: projects.length,
      sessions: sessions.length,
      skills: skills.length,
      tasksTotal: tasks.length,
      tasksEnabled: tasks.filter((t) => t.enabled).length,
      providers: providers.length,
    },
    week: { userMessages: userMsgs, assistantMessages: asstMsgs, providerCounts },
    recentSessions: sessions.slice(0, 6),
    activeRoutines: tasks.filter((t) => t.enabled).slice(0, 5),
    providers,
  });
}
