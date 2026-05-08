import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agents/orchestrator";
import { appendMessage, createSession, getSessionAsync } from "@/lib/db/sessions";
import { getProject, createProject, listProjects, updateProject } from "@/lib/db/projects";
import { ensureWorkspace } from "@/lib/db/sqlite";
import { backpackContextSnippet } from "@/lib/db/backpack";
import { memoryContextSnippet } from "@/lib/db/memory";
import { getSkill } from "@/lib/db/skills";
import type { CoreMessage } from "ai";

export const runtime = "nodejs";
export const maxDuration = 300;

type ChatBody = {
  sessionId?: string;
  projectId?: string | null;
  message: string;
  preferredProvider?: string;
  enabledTools?: string[];
  skillId?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatBody;
  if (!body.message?.trim()) {
    return Response.json({ error: "Empty message" }, { status: 400 });
  }

  let session = body.sessionId ? await getSessionAsync(body.sessionId) : null;
  if (!session) {
    session = await createSession({ projectId: body.projectId ?? null, title: body.message.slice(0, 60) });
  }

  const project = session.projectId ? getProject(session.projectId) : null;
  let projectForRun = project;
  if (!projectForRun) {
    // Reuse first existing project; only create if database empty
    const existing = listProjects();
    projectForRun = existing[0] ?? (await createProject({ name: "Default", description: "Auto-created default project" }));
  }
  const workspacePath = projectForRun.workspacePath ?? (await ensureWorkspace(projectForRun.id));

  // Auto-rename "Default" project from first user message
  if (projectForRun.name === "Default" && body.message.trim()) {
    const niceName = body.message.trim().split(/\n/)[0].slice(0, 40).replace(/[?!.…]+$/, "");
    if (niceName.length > 4) {
      await updateProject(projectForRun.id, { name: niceName });
      projectForRun = { ...projectForRun, name: niceName };
    }
  }

  const userMsg = await appendMessage(session.id, {
    role: "user", content: body.message, toolCalls: [], attachments: [],
  });

  const history = await getSessionAsync(session.id);
  const aiMessages: CoreMessage[] = (history?.messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const memSnippet = await memoryContextSnippet(projectForRun.id);
  const bagSnippet = await backpackContextSnippet(projectForRun.id);
  const skill = body.skillId ? getSkill(body.skillId) : null;
  const projectPrompt = projectForRun.systemPrompt?.trim();
  const skillPrompt = skill?.systemPrompt?.trim();
  const systemPrompt = skillPrompt || undefined;
  const extraSystem = [projectPrompt, memSnippet, bagSnippet].filter(Boolean).join("\n\n") || undefined;
  const enabledTools = body.enabledTools ?? (skill && skill.toolWhitelist.length > 0 ? skill.toolWhitelist : undefined);

  // NOTE: deliberately not tying agent run to req.signal — we want background
  // persistence to complete even when client disconnects. Stop button uses a
  // separate kill switch via DELETE /api/sessions/[id]/abort (TODO).

  const { result, provider } = await runAgent({
    messages: aiMessages,
    systemPrompt,
    extraSystem,
    preferredProvider: body.preferredProvider ?? session.pinnedModel,
    toolContext: {
      projectId: projectForRun.id,
      workspacePath,
      sessionId: session.id,
    },
    enabledTools,
  });

  const stream = result.toDataStream({
    getErrorMessage: (e) => (e instanceof Error ? e.message : String(e)),
  });

  // Persist final assistant message after stream completes (fire-and-forget,
  // detached from request lifecycle so client disconnects don't lose data)
  void (async () => {
    try {
      const text = await result.text.catch(() => "");
      const toolCalls = (await result.toolCalls.catch(() => [])).map((tc) => ({
        id: tc.toolCallId, name: tc.toolName, args: tc.args as Record<string, unknown>,
        status: "ok" as const,
      }));
      // Persist even if text is empty but tool calls exist
      if (!text && toolCalls.length === 0) return;
      await appendMessage(session!.id, {
        role: "assistant", content: text, toolCalls, attachments: [],
        provider, model: provider,
      });
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error("[praxon chat persist]", e);
    }
  })();

  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "X-Praxon-Session": session.id,
    "X-Praxon-Provider": provider,
    "X-User-Message-Id": userMsg.id,
  });

  return new Response(stream, { headers });
}
