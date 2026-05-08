import { NextRequest } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/db/projects";
import { listSessions } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  const sessions = listSessions(id);
  return Response.json({ project: p, sessions });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const p = await updateProject(id, patch);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ project: p });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = await deleteProject(id);
  return Response.json({ ok });
}
