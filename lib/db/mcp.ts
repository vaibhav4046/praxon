import "server-only";
import { nanoid } from "nanoid";
import { mcpStore, type McpRow } from "./store";
import { getUserId, supabaseEnabled, getDbClient } from "./user";

export type McpServer = {
  id: string; name: string; command: string;
  args: string[]; env: Record<string, string>;
  enabled: boolean; createdAt: number;
};

function rowToServer(r: McpRow): McpServer {
  return {
    id: r.id, name: r.name, command: r.command,
    args: r.args, env: r.env, enabled: r.enabled, createdAt: r.createdAt,
  };
}
function dbRowToServer(r: Record<string, unknown>): McpServer {
  return {
    id: r.id as string, name: r.name as string, command: r.command as string,
    args: (r.args as string[]) ?? [], env: (r.env as Record<string, string>) ?? {},
    enabled: r.enabled as boolean,
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

export async function listMcpServers(): Promise<McpServer[]> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { data } = await supa.from("mcp_servers").select("*").order("name", { ascending: true });
      if (data) return ((data ?? []) as Record<string, unknown>[]).map(dbRowToServer);
    }
  }
  return mcpStore.readSync().slice().sort((a, b) => a.name.localeCompare(b.name)).map(rowToServer);
}

export async function createMcpServer(input: { name: string; command: string; args?: string[]; env?: Record<string, string>; enabled?: boolean }): Promise<McpServer> {
  const id = nanoid(12);
  const now = Date.now();
  const server: McpServer = {
    id, name: input.name, command: input.command,
    args: input.args ?? [], env: input.env ?? {},
    enabled: input.enabled !== false, createdAt: now,
  };
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const userId = await getUserId();
      const { error } = await supa.from("mcp_servers").insert({
        id, user_id: userId, name: server.name, command: server.command,
        args: server.args, env: server.env, enabled: server.enabled,
      });
      if (!error) return server;
    }
  }
  const row: McpRow = { ...server };
  const all = mcpStore.readSync();
  all.push(row);
  mcpStore.writeSync(all);
  return server;
}

export async function setMcpEnabled(id: string, enabled: boolean): Promise<void> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      await supa.from("mcp_servers").update({ enabled }).eq("id", id);
      return;
    }
  }
  const all = mcpStore.readSync();
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], enabled };
    mcpStore.writeSync(all);
  }
}

export async function deleteMcpServer(id: string): Promise<boolean> {
  if (supabaseEnabled()) {
    const supa = await getDbClient();
    if (supa) {
      const { error } = await supa.from("mcp_servers").delete().eq("id", id);
      if (!error) return true;
    }
  }
  const all = mcpStore.readSync();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  mcpStore.writeSync(next);
  return true;
}
