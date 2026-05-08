import "server-only";
import { nanoid } from "nanoid";
import path from "node:path";
import { promises as fs } from "node:fs";
import { getDataDir } from "./store";
import type { Artifact } from "../types";

function artifactsFile(): string {
  return path.join(getDataDir(), "artifacts.json");
}

async function readAll(): Promise<Artifact[]> {
  try {
    return JSON.parse(await fs.readFile(artifactsFile(), "utf8")) as Artifact[];
  } catch {
    return [];
  }
}
async function writeAll(arr: Artifact[]) {
  const tmp = artifactsFile() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(arr, null, 2), "utf8");
  await fs.rename(tmp, artifactsFile());
}

export async function listArtifacts(sessionId?: string): Promise<Artifact[]> {
  const all = await readAll();
  return sessionId ? all.filter((a) => a.sessionId === sessionId) : all;
}

export async function createArtifact(input: Omit<Artifact, "id" | "createdAt">): Promise<Artifact> {
  const a: Artifact = { ...input, id: nanoid(12), createdAt: Date.now() };
  const all = await readAll();
  all.push(a);
  await writeAll(all);
  return a;
}

export async function deleteArtifact(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
