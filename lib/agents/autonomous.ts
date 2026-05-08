import "server-only";
import { runAgent } from "./orchestrator";
import { ensureWorkspace } from "../db/store";
import { createProject, getProject, listProjects } from "../db/projects";
import { createSession, appendMessage } from "../db/sessions";
import { nanoid } from "nanoid";

export type AgentRunEvent =
  | { type: "step"; n: number; thought: string; output: string }
  | { type: "done"; reason: "goal-met" | "max-steps" | "error"; final: string }
  | { type: "error"; message: string };

const LOOP_SYSTEM = `You are an autonomous agent. You will be given a high-level goal and a working budget of steps.

For each step:
1. Decide ONE concrete next action toward the goal.
2. Use available tools (file r/w, shell, web search, fetch_url, browser_*, memory_*) freely.
3. Output a short status line of what you did and what's next.

Stop early when the goal is met. Be terse. Don't restate the goal each step.`;

export async function* runAutonomous(opts: {
  goal: string;
  projectId?: string;
  preferredProvider?: string;
  maxSteps?: number;
}): AsyncGenerator<AgentRunEvent> {
  let project = opts.projectId ? getProject(opts.projectId) : listProjects()[0];
  if (!project) project = await createProject({ name: "Autonomous", description: "Auto-created for autonomous agent" });
  const ws = project.workspacePath ?? (await ensureWorkspace(project.id));
  const sessionId = `auto-${nanoid(8)}`;
  const session = await createSession({ projectId: project.id, title: `auto: ${opts.goal.slice(0, 50)}` });
  await appendMessage(session.id, { role: "user", content: opts.goal, toolCalls: [], attachments: [] });

  const max = Math.max(1, Math.min(20, opts.maxSteps ?? 8));
  const transcript: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: `Goal: ${opts.goal}\n\nYou have up to ${max} steps. Take step 1.` },
  ];

  for (let step = 1; step <= max; step++) {
    try {
      const { result, provider } = await runAgent({
        messages: transcript,
        systemPrompt: LOOP_SYSTEM,
        preferredProvider: opts.preferredProvider,
        toolContext: { projectId: project.id, workspacePath: ws, sessionId: session.id },
        maxSteps: 6,
      });
      const text = await result.text;
      transcript.push({ role: "assistant", content: text });
      await appendMessage(session.id, { role: "assistant", content: text, toolCalls: [], attachments: [], provider });
      yield { type: "step", n: step, thought: "", output: text };

      const lower = text.toLowerCase();
      if (lower.includes("goal met") || lower.includes("task complete") || lower.includes("done.")) {
        yield { type: "done", reason: "goal-met", final: text };
        return;
      }
      transcript.push({ role: "user", content: `Take step ${step + 1}. (or say "Goal met." if finished)` });
    } catch (e) {
      yield { type: "error", message: e instanceof Error ? e.message : String(e) };
      return;
    }
  }
  yield { type: "done", reason: "max-steps", final: transcript[transcript.length - 1]?.content ?? "" };
}
