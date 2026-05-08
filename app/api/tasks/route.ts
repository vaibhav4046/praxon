import { NextRequest } from "next/server";
import { listTasksAsync, createTask } from "@/lib/db/tasks";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ tasks: await listTasksAsync() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || !body?.cron || !body?.prompt) {
    return Response.json({ error: "name, cron, prompt required" }, { status: 400 });
  }
  const t = await createTask({
    name: body.name,
    cron: body.cron,
    prompt: body.prompt,
    projectId: body.projectId ?? null,
    enabled: body.enabled ?? true,
  });
  return Response.json({ task: t }, { status: 201 });
}
