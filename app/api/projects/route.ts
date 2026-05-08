import { NextRequest } from "next/server";
import { listProjects, createProject } from "@/lib/db/projects";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ projects: listProjects() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name?.trim()) return Response.json({ error: "name required" }, { status: 400 });
  const p = await createProject({
    name: body.name,
    description: body.description ?? "",
    systemPrompt: body.systemPrompt ?? "",
  });
  return Response.json({ project: p }, { status: 201 });
}
