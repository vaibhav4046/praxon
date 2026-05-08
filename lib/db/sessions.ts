import "server-only";
import { nanoid } from "nanoid";
import { sessionsStore, messagesStore, type SessionRow, type MessageRow } from "./store";
import { getUserId, supabaseEnabled, getDbClient } from "./user";
import type { Session, Message } from "../types";

function rowToMessage(r: MessageRow): Message {
  return {
    id: r.id, role: r.role as Message["role"], content: r.content,
    toolCalls: (r.toolCalls as Message["toolCalls"]) ?? [],
    attachments: (r.attachments as Message["attachments"]) ?? [],
    provider: r.provider ?? undefined, model: r.model ?? undefined,
    createdAt: r.createdAt,
  };
}

function dbRowToMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as string,
    role: r.role as Message["role"],
    content: r.content as string,
    toolCalls: (r.tool_calls as Message["toolCalls"]) ?? [],
    attachments: (r.attachments as Message["attachments"]) ?? [],
    provider: (r.provider as string) ?? undefined,
    model: (r.model as string) ?? undefined,
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

function rowToSession(r: SessionRow, msgs: Message[]): Session {
  return {
    id: r.id, projectId: r.projectId, title: r.title,
    pinnedModel: r.pinnedModel ?? undefined,
    messages: msgs, createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

function dbRowToSession(r: Record<string, unknown>, msgs: Message[]): Session {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) ?? null,
    title: r.title as string,
    pinnedModel: (r.pinned_model as string) ?? undefined,
    messages: msgs,
    createdAt: new Date(r.created_at as string).getTime(),
    updatedAt: new Date(r.updated_at as string).getTime(),
  };
}

export async function createSession(input: { projectId?: string | null; title?: string; pinnedModel?: string }): Promise<Session> {
  const id = nanoid(12);
  const now = Date.now();
  const session: Session = {
    id, projectId: input.projectId ?? null, title: input.title ?? "New chat",
    pinnedModel: input.pinnedModel,
    messages: [], createdAt: now, updatedAt: now,
  };
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const userId = await getUserId();
      const { error } = await supa.from("sessions").insert({
        id, user_id: userId, project_id: input.projectId ?? null,
        title: session.title, pinned_model: input.pinnedModel ?? null,
      });
      if (!error) return session;
    }
  }
  const row: SessionRow = {
    id, projectId: input.projectId ?? null, title: session.title,
    pinnedModel: input.pinnedModel ?? null, createdAt: now, updatedAt: now,
  };
  const all = sessionsStore.readSync();
  all.push(row);
  sessionsStore.writeSync(all);
  return session;
}

export async function getSessionAsync(id: string): Promise<Session | null> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data: srow } = await supa.from("sessions").select("*").eq("id", id).maybeSingle();
      if (srow) {
        const { data: mrows } = await supa.from("messages").select("*").eq("session_id", id).order("created_at", { ascending: true });
        const msgs = ((mrows ?? []) as Record<string, unknown>[]).map(dbRowToMessage);
        return dbRowToSession(srow as Record<string, unknown>, msgs);
      }
    }
  }
  const r = sessionsStore.readSync().find((s) => s.id === id);
  if (!r) return null;
  const msgs = messagesStore.readSync()
    .filter((m) => m.sessionId === id)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(rowToMessage);
  return rowToSession(r, msgs);
}

/** Sync — JSON only. */
export function getSession(id: string): Session | null {
  const r = sessionsStore.readSync().find((s) => s.id === id);
  if (!r) return null;
  const msgs = messagesStore.readSync()
    .filter((m) => m.sessionId === id)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(rowToMessage);
  return rowToSession(r, msgs);
}

export async function listSessionsAsync(projectId?: string | null, limit = 100): Promise<Session[]> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      let q = supa.from("sessions").select("*").order("updated_at", { ascending: false }).limit(limit);
      if (projectId !== undefined) q = q.eq("project_id", projectId as string);
      const { data } = await q;
      if (data) return ((data ?? []) as Record<string, unknown>[]).map((r) => dbRowToSession(r, []));
    }
  }
  const rows = sessionsStore.readSync()
    .filter((s) => projectId === undefined ? true : s.projectId === projectId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
  return rows.map((r) => rowToSession(r, []));
}

/** Sync — JSON only. */
export function listSessions(projectId?: string | null, limit = 100): Session[] {
  const rows = sessionsStore.readSync()
    .filter((s) => projectId === undefined ? true : s.projectId === projectId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
  return rows.map((r) => rowToSession(r, []));
}

export async function appendMessage(sessionId: string, msg: Omit<Message, "id" | "createdAt"> & { id?: string; createdAt?: number }): Promise<Message> {
  const id = msg.id ?? nanoid(14);
  const createdAt = msg.createdAt ?? Date.now();
  const out: Message = {
    id, role: msg.role, content: msg.content,
    toolCalls: msg.toolCalls ?? [], attachments: msg.attachments ?? [],
    provider: msg.provider, model: msg.model, createdAt,
  };

  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const userId = await getUserId();
      await supa.from("messages").insert({
        id, user_id: userId, session_id: sessionId, role: msg.role, content: msg.content,
        tool_calls: msg.toolCalls ?? [], attachments: msg.attachments ?? [],
        provider: msg.provider ?? null, model: msg.model ?? null,
        created_at: new Date(createdAt).toISOString(),
      });
      await supa.from("sessions").update({ updated_at: new Date(createdAt).toISOString() }).eq("id", sessionId);
      return out;
    }
  }
  const row: MessageRow = {
    id, sessionId, role: msg.role, content: msg.content,
    toolCalls: (msg.toolCalls ?? []) as unknown[],
    attachments: (msg.attachments ?? []) as unknown[],
    provider: msg.provider ?? null, model: msg.model ?? null, createdAt,
  };
  const allMsgs = messagesStore.readSync();
  allMsgs.push(row);
  messagesStore.writeSync(allMsgs);
  const allSess = sessionsStore.readSync();
  const idx = allSess.findIndex((s) => s.id === sessionId);
  if (idx >= 0) {
    allSess[idx] = { ...allSess[idx], updatedAt: createdAt };
    sessionsStore.writeSync(allSess);
  }
  return out;
}

export async function updateSessionTitle(id: string, title: string): Promise<void> {
  const now = Date.now();
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      await supa.from("sessions").update({ title, updated_at: new Date(now).toISOString() }).eq("id", id);
      return;
    }
  }
  const all = sessionsStore.readSync();
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], title, updatedAt: now };
    sessionsStore.writeSync(all);
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { error } = await supa.from("sessions").delete().eq("id", id);
      if (!error) return true;
    }
  }
  const all = sessionsStore.readSync();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  sessionsStore.writeSync(next);
  const msgs = messagesStore.readSync().filter((m) => m.sessionId !== id);
  messagesStore.writeSync(msgs);
  return true;
}
