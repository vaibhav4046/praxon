import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getProject } from "@/lib/db/projects";

export const runtime = "nodejs";

function safeJoin(workspace: string, rel: string): string {
  const abs = path.resolve(workspace, rel);
  if (!abs.startsWith(path.resolve(workspace))) throw new Error("escape");
  return abs;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = getProject(projectId);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  const rel = req.nextUrl.searchParams.get("path");
  if (!rel) return Response.json({ error: "path required" }, { status: 400 });
  try {
    const abs = safeJoin(p.workspacePath, rel);
    const content = await fs.readFile(abs, "utf8");
    return Response.json({ path: rel, content });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = getProject(projectId);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  const { path: rel, content } = await req.json();
  if (typeof rel !== "string" || typeof content !== "string") {
    return Response.json({ error: "path & content required" }, { status: 400 });
  }
  try {
    const abs = safeJoin(p.workspacePath, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}
