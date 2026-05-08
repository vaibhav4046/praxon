import { NextRequest } from "next/server";
import { listSessionsAsync, createSession } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  return Response.json({ sessions: await listSessionsAsync(projectId === null ? undefined : projectId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const s = await createSession({
    projectId: body.projectId ?? null,
    title: body.title ?? "New chat",
    pinnedModel: body.pinnedModel,
  });
  return Response.json({ session: s }, { status: 201 });
}
