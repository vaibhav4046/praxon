import "server-only";
import { nanoid } from "nanoid";
import { projectsStore, ensureWorkspace, type ProjectRow } from "./store";
import { getUserId, supabaseEnabled, getDbClient } from "./user";
import type { Project } from "../types";

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id, name: r.name, description: r.description,
    systemPrompt: r.systemPrompt, workspacePath: r.workspacePath,
    memory: r.memory, skills: r.skills, mcpServers: r.mcpServers,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

function dbRowToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? "",
    systemPrompt: (r.system_prompt as string) ?? "",
    workspacePath: r.workspace_path as string,
    memory: (r.memory as string[]) ?? [],
    skills: (r.skills as string[]) ?? [],
    mcpServers: (r.mcp_servers as string[]) ?? [],
    createdAt: new Date(r.created_at as string).getTime(),
    updatedAt: new Date(r.updated_at as string).getTime(),
  };
}

export async function createProject(input: {
  name: string; description?: string; systemPrompt?: string;
}): Promise<Project> {
  const id = nanoid(12);
  const now = Date.now();
  const ws = await ensureWorkspace(id);
  const project: Project = {
    id, name: input.name, description: input.description ?? "",
    systemPrompt: input.systemPrompt ?? "", workspacePath: ws,
    memory: [], skills: [], mcpServers: [], createdAt: now, updatedAt: now,
  };

  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const userId = await getUserId();
      const { error } = await supa.from("projects").insert({
        id, user_id: userId, name: project.name, description: project.description,
        system_prompt: project.systemPrompt, workspace_path: ws,
        memory: project.memory, skills: project.skills, mcp_servers: project.mcpServers,
      });
      if (!error) return project;
      // fall through to JSON on error
    }
  }
  const row: ProjectRow = {
    ...project,
  };
  const all = projectsStore.readSync();
  all.push(row);
  projectsStore.writeSync(all);
  return project;
}

export async function getProjectAsync(id: string): Promise<Project | null> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data } = await supa.from("projects").select("*").eq("id", id).maybeSingle();
      if (data) return dbRowToProject(data as Record<string, unknown>);
    }
  }
  const r = projectsStore.readSync().find((p) => p.id === id);
  return r ? rowToProject(r) : null;
}

/** Sync access for hot paths. Falls back to JSON only — Supabase requires async. */
export function getProject(id: string): Project | null {
  const r = projectsStore.readSync().find((p) => p.id === id);
  return r ? rowToProject(r) : null;
}

export async function listProjectsAsync(): Promise<Project[]> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data } = await supa.from("projects").select("*").order("updated_at", { ascending: false });
      if (data) return (data as Record<string, unknown>[]).map(dbRowToProject);
    }
  }
  return projectsStore.readSync()
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(rowToProject);
}

/** Sync — JSON store only. */
export function listProjects(): Project[] {
  return projectsStore.readSync()
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(rowToProject);
}

export async function updateProject(id: string, patch: Partial<Pick<Project, "name" | "description" | "systemPrompt" | "memory" | "skills" | "mcpServers">>): Promise<Project | null> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.systemPrompt !== undefined) dbPatch.system_prompt = patch.systemPrompt;
      if (patch.memory !== undefined) dbPatch.memory = patch.memory;
      if (patch.skills !== undefined) dbPatch.skills = patch.skills;
      if (patch.mcpServers !== undefined) dbPatch.mcp_servers = patch.mcpServers;
      const { data } = await supa.from("projects").update(dbPatch).eq("id", id).select("*").maybeSingle();
      if (data) return dbRowToProject(data as Record<string, unknown>);
    }
  }
  const all = projectsStore.readSync();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const cur = all[idx];
  const next: ProjectRow = {
    ...cur,
    name: patch.name ?? cur.name,
    description: patch.description ?? cur.description,
    systemPrompt: patch.systemPrompt ?? cur.systemPrompt,
    memory: patch.memory ?? cur.memory,
    skills: patch.skills ?? cur.skills,
    mcpServers: patch.mcpServers ?? cur.mcpServers,
    updatedAt: Date.now(),
  };
  all[idx] = next;
  projectsStore.writeSync(all);
  return rowToProject(next);
}

export async function deleteProject(id: string): Promise<boolean> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { error } = await supa.from("projects").delete().eq("id", id);
      if (!error) return true;
    }
  }
  const all = projectsStore.readSync();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  projectsStore.writeSync(next);
  return true;
}
