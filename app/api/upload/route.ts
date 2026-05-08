import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { getProject } from "@/lib/db/projects";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const projectId = form.get("projectId");
  const file = form.get("file");
  if (typeof projectId !== "string" || !(file instanceof File)) {
    return Response.json({ error: "projectId & file required" }, { status: 400 });
  }
  const project = getProject(projectId);
  if (!project) return Response.json({ error: "project not found" }, { status: 404 });
  const uploadsDir = path.join(project.workspacePath, ".praxon", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const id = nanoid(10);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(uploadsDir, `${id}-${safeName}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, bytes);
  return Response.json({
    id,
    name: file.name,
    size: bytes.length,
    mime: file.type,
    path: path.relative(project.workspacePath, dest).replace(/\\/g, "/"),
  });
}
