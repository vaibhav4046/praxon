import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getProject } from "@/lib/db/projects";

export const runtime = "nodejs";

type TreeNode = { name: string; path: string; type: "dir" | "file"; children?: TreeNode[] };

async function buildTree(rootAbs: string, rel = "", depth = 0, maxDepth = 6): Promise<TreeNode[]> {
  if (depth > maxDepth) return [];
  const entries = await fs.readdir(path.join(rootAbs, rel), { withFileTypes: true });
  const out: TreeNode[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".praxon") continue;
    if (e.name === "node_modules") continue;
    const childRel = path.posix.join(rel, e.name);
    if (e.isDirectory()) {
      out.push({ name: e.name, path: childRel, type: "dir", children: await buildTree(rootAbs, childRel, depth + 1, maxDepth) });
    } else if (e.isFile()) {
      out.push({ name: e.name, path: childRel, type: "file" });
    }
  }
  out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
  return out;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = getProject(projectId);
  if (!p) return Response.json({ error: "project not found" }, { status: 404 });
  await fs.mkdir(p.workspacePath, { recursive: true });
  const tree = await buildTree(p.workspacePath);
  return Response.json({ workspacePath: p.workspacePath, tree });
}
