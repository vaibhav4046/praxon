import "server-only";
import { nanoid } from "nanoid";
import { tasksStore, type TaskRow } from "./store";
import { getUserId, supabaseEnabled, getDbClient } from "./user";
import type { ScheduledTask } from "../types";

function rowToTask(r: TaskRow): ScheduledTask {
  return {
    id: r.id, name: r.name, cron: r.cron, prompt: r.prompt,
    projectId: r.projectId, enabled: r.enabled,
    lastRun: r.lastRun, nextRun: r.nextRun,
    createdAt: r.createdAt,
  };
}
function dbRowToTask(r: Record<string, unknown>): ScheduledTask {
  return {
    id: r.id as string, name: r.name as string, cron: r.cron as string,
    prompt: r.prompt as string, projectId: (r.project_id as string) ?? null,
    enabled: r.enabled as boolean,
    lastRun: r.last_run ? new Date(r.last_run as string).getTime() : null,
    nextRun: r.next_run ? new Date(r.next_run as string).getTime() : null,
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

export async function listTasksAsync(): Promise<ScheduledTask[]> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data } = await supa.from("scheduled_tasks").select("*").order("created_at", { ascending: false });
      if (data) return ((data ?? []) as Record<string, unknown>[]).map(dbRowToTask);
    }
  }
  return tasksStore.readSync().slice().sort((a, b) => b.createdAt - a.createdAt).map(rowToTask);
}

/** Sync — JSON only (used by scheduler). */
export function listTasks(): ScheduledTask[] {
  return tasksStore.readSync().slice().sort((a, b) => b.createdAt - a.createdAt).map(rowToTask);
}

export async function createTask(input: Omit<ScheduledTask, "id" | "createdAt" | "lastRun" | "nextRun">): Promise<ScheduledTask> {
  const id = nanoid(12);
  const now = Date.now();
  const task: ScheduledTask = { ...input, id, createdAt: now, lastRun: null, nextRun: null };
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const userId = await getUserId();
      const { error } = await supa.from("scheduled_tasks").insert({
        id, user_id: userId, name: task.name, cron: task.cron, prompt: task.prompt,
        project_id: task.projectId, enabled: task.enabled,
      });
      if (!error) return task;
    }
  }
  const row: TaskRow = {
    id, name: task.name, cron: task.cron, prompt: task.prompt,
    projectId: task.projectId, enabled: task.enabled,
    lastRun: null, nextRun: null, createdAt: now,
  };
  const all = tasksStore.readSync();
  all.push(row);
  tasksStore.writeSync(all);
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { error } = await supa.from("scheduled_tasks").delete().eq("id", id);
      if (!error) return true;
    }
  }
  const all = tasksStore.readSync();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  tasksStore.writeSync(next);
  return true;
}

export async function setTaskEnabled(id: string, enabled: boolean): Promise<void> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      await supa.from("scheduled_tasks").update({ enabled }).eq("id", id);
      return;
    }
  }
  const all = tasksStore.readSync();
  const idx = all.findIndex((t) => t.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], enabled };
    tasksStore.writeSync(all);
  }
}

export async function markTaskRun(id: string, when = Date.now()): Promise<void> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      await supa.from("scheduled_tasks").update({ last_run: new Date(when).toISOString() }).eq("id", id);
      return;
    }
  }
  const all = tasksStore.readSync();
  const idx = all.findIndex((t) => t.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastRun: when };
    tasksStore.writeSync(all);
  }
}
