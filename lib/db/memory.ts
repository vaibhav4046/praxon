import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getProject } from "./projects";

function memFile(workspacePath: string): string {
  return path.join(workspacePath, ".praxon", "memory.md");
}

export async function readMemory(projectId: string): Promise<string> {
  const p = getProject(projectId);
  if (!p) return "";
  try { return await fs.readFile(memFile(p.workspacePath), "utf8"); }
  catch { return ""; }
}

export async function writeMemory(projectId: string, content: string): Promise<boolean> {
  const p = getProject(projectId);
  if (!p) return false;
  await fs.mkdir(path.dirname(memFile(p.workspacePath)), { recursive: true });
  const tmp = memFile(p.workspacePath) + ".tmp";
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, memFile(p.workspacePath));
  return true;
}

export async function memoryContextSnippet(projectId: string, maxChars = 4000): Promise<string> {
  const mem = (await readMemory(projectId)).trim();
  if (!mem) return "";
  return `\n## Project memory\n${mem.slice(0, maxChars)}`;
}
