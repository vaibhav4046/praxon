import "server-only";
import { nanoid } from "nanoid";
import { skillsStore, type SkillRow } from "./store";
import { getUserId, supabaseEnabled, getDbClient } from "./user";
import type { Skill } from "../types";

function rowToSkill(r: SkillRow): Skill {
  return {
    id: r.id, name: r.name, description: r.description, trigger: r.trigger,
    systemPrompt: r.systemPrompt, toolWhitelist: r.toolWhitelist,
    createdAt: r.createdAt,
  };
}
function dbRowToSkill(r: Record<string, unknown>): Skill {
  return {
    id: r.id as string, name: r.name as string,
    description: (r.description as string) ?? "", trigger: (r.trigger as string) ?? "",
    systemPrompt: r.system_prompt as string,
    toolWhitelist: (r.tool_whitelist as string[]) ?? [],
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

export async function listSkillsAsync(): Promise<Skill[]> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data } = await supa.from("skills").select("*").order("name", { ascending: true });
      if (data) return ((data ?? []) as Record<string, unknown>[]).map(dbRowToSkill);
    }
  }
  return skillsStore.readSync().slice().sort((a, b) => a.name.localeCompare(b.name)).map(rowToSkill);
}

/** Sync — JSON only. */
export function listSkills(): Skill[] {
  return skillsStore.readSync().slice().sort((a, b) => a.name.localeCompare(b.name)).map(rowToSkill);
}

export async function createSkill(input: Omit<Skill, "id" | "createdAt">): Promise<Skill> {
  const id = nanoid(12);
  const now = Date.now();
  const skill: Skill = { ...input, id, createdAt: now, toolWhitelist: input.toolWhitelist ?? [] };
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const userId = await getUserId();
      const { error } = await supa.from("skills").insert({
        id, user_id: userId, name: skill.name, description: skill.description,
        trigger: skill.trigger, system_prompt: skill.systemPrompt, tool_whitelist: skill.toolWhitelist,
      });
      if (!error) return skill;
    }
  }
  const row: SkillRow = {
    id, name: skill.name, description: skill.description, trigger: skill.trigger,
    systemPrompt: skill.systemPrompt, toolWhitelist: skill.toolWhitelist, createdAt: now,
  };
  const all = skillsStore.readSync();
  all.push(row);
  skillsStore.writeSync(all);
  return skill;
}

export async function deleteSkill(id: string): Promise<boolean> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { error } = await supa.from("skills").delete().eq("id", id);
      if (!error) return true;
    }
  }
  const all = skillsStore.readSync();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  skillsStore.writeSync(next);
  return true;
}

export async function getSkillAsync(id: string): Promise<Skill | null> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data } = await supa.from("skills").select("*").eq("id", id).maybeSingle();
      if (data) return dbRowToSkill(data as Record<string, unknown>);
    }
  }
  const r = skillsStore.readSync().find((s) => s.id === id);
  return r ? rowToSkill(r) : null;
}

/** Sync — JSON only. */
export function getSkill(id: string): Skill | null {
  const r = skillsStore.readSync().find((s) => s.id === id);
  return r ? rowToSkill(r) : null;
}
