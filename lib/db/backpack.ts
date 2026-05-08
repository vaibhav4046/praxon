import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { getProject } from "./projects";

export type BackpackItem = {
  id: string;
  name: string;
  kind: "file" | "note";
  path: string;          // relative to project workspace
  size: number;
  mime?: string;
  preview: string;       // first ~1KB for the model
  pinned: boolean;
  createdAt: number;
};

function backpackDir(workspacePath: string): string {
  return path.join(workspacePath, ".praxon", "backpack");
}
function indexPath(workspacePath: string): string {
  return path.join(backpackDir(workspacePath), "index.json");
}

async function readIndex(workspacePath: string): Promise<BackpackItem[]> {
  try {
    return JSON.parse(await fs.readFile(indexPath(workspacePath), "utf8")) as BackpackItem[];
  } catch {
    return [];
  }
}
async function writeIndex(workspacePath: string, items: BackpackItem[]) {
  await fs.mkdir(backpackDir(workspacePath), { recursive: true });
  const tmp = indexPath(workspacePath) + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmp, indexPath(workspacePath));
}

export async function listBackpack(projectId: string): Promise<BackpackItem[]> {
  const p = getProject(projectId);
  if (!p) return [];
  return await readIndex(p.workspacePath);
}

export async function addBackpackFile(projectId: string, file: { name: string; mime?: string; bytes: Buffer }): Promise<BackpackItem | null> {
  const p = getProject(projectId);
  if (!p) return null;
  const dir = backpackDir(p.workspacePath);
  await fs.mkdir(dir, { recursive: true });
  const id = nanoid(10);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fname = `${id}-${safe}`;
  const abs = path.join(dir, fname);
  await fs.writeFile(abs, file.bytes);
  const isText = (file.mime ?? "").startsWith("text/") || /\.(md|txt|json|csv|tsv|ts|tsx|js|jsx|py|rb|go|rs|java|css|html|yml|yaml|toml|env|sh)$/i.test(safe);
  const preview = isText ? file.bytes.toString("utf8").slice(0, 4096) : `[binary ${file.bytes.length} bytes]`;
  const item: BackpackItem = {
    id, name: file.name, kind: "file",
    path: path.relative(p.workspacePath, abs).replace(/\\/g, "/"),
    size: file.bytes.length, mime: file.mime, preview, pinned: true,
    createdAt: Date.now(),
  };
  const idx = await readIndex(p.workspacePath);
  idx.push(item);
  await writeIndex(p.workspacePath, idx);
  return item;
}

export async function addBackpackNote(projectId: string, name: string, content: string): Promise<BackpackItem | null> {
  const p = getProject(projectId);
  if (!p) return null;
  const dir = backpackDir(p.workspacePath);
  await fs.mkdir(dir, { recursive: true });
  const id = nanoid(10);
  const safe = (name || "note").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fname = `${id}-${safe}.md`;
  const abs = path.join(dir, fname);
  await fs.writeFile(abs, content, "utf8");
  const item: BackpackItem = {
    id, name: name || "Note", kind: "note",
    path: path.relative(p.workspacePath, abs).replace(/\\/g, "/"),
    size: Buffer.byteLength(content, "utf8"), mime: "text/markdown",
    preview: content.slice(0, 4096), pinned: true,
    createdAt: Date.now(),
  };
  const idx = await readIndex(p.workspacePath);
  idx.push(item);
  await writeIndex(p.workspacePath, idx);
  return item;
}

export async function deleteBackpackItem(projectId: string, id: string): Promise<boolean> {
  const p = getProject(projectId);
  if (!p) return false;
  const idx = await readIndex(p.workspacePath);
  const item = idx.find((i) => i.id === id);
  if (!item) return false;
  try { await fs.unlink(path.join(p.workspacePath, item.path)); } catch { /* */ }
  await writeIndex(p.workspacePath, idx.filter((i) => i.id !== id));
  return true;
}

export async function setPinned(projectId: string, id: string, pinned: boolean): Promise<boolean> {
  const p = getProject(projectId);
  if (!p) return false;
  const idx = await readIndex(p.workspacePath);
  const i = idx.findIndex((x) => x.id === id);
  if (i < 0) return false;
  idx[i] = { ...idx[i], pinned };
  await writeIndex(p.workspacePath, idx);
  return true;
}

export async function backpackContextSnippet(projectId: string, maxChars = 6000): Promise<string> {
  const items = await listBackpack(projectId);
  const pinned = items.filter((i) => i.pinned);
  if (pinned.length === 0) return "";
  let used = 0;
  const blocks: string[] = [];
  for (const item of pinned) {
    const head = `\n\n---\n# ${item.name}${item.kind === "note" ? " (note)" : ""}\n`;
    const room = Math.max(0, maxChars - used - head.length - 50);
    if (room <= 0) break;
    const body = item.preview.slice(0, room);
    blocks.push(head + body);
    used += head.length + body.length;
  }
  return blocks.length ? `\n## Project knowledge (Backpack)${blocks.join("")}` : "";
}
