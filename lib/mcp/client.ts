import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";
import type { ToolDef } from "../agents/tools/types";

export type McpServerConfig = {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
};

const _clients = new Map<string, Client>();

export async function connectMcp(cfg: McpServerConfig): Promise<Client> {
  const existing = _clients.get(cfg.id);
  if (existing) return existing;
  const transport = new StdioClientTransport({
    command: cfg.command,
    args: cfg.args,
    env: { ...process.env, ...(cfg.env ?? {}) } as Record<string, string>,
  });
  const client = new Client({ name: "praxon", version: "0.1.0" }, { capabilities: {} });
  await client.connect(transport);
  _clients.set(cfg.id, client);
  return client;
}

export async function disconnectMcp(id: string) {
  const c = _clients.get(id);
  if (c) {
    await c.close();
    _clients.delete(id);
  }
}

export async function listMcpTools(cfg: McpServerConfig): Promise<ToolDef[]> {
  const client = await connectMcp(cfg);
  const res = await client.listTools();
  return res.tools.map((t) => ({
    name: `mcp_${cfg.name}_${t.name}`,
    description: `[${cfg.name}] ${t.description ?? t.name}`,
    category: "mcp" as const,
    parameters: z.record(z.unknown()), // schema-flexible — MCP server validates
    run: async (args, _ctx) => {
      const r = await client.callTool({ name: t.name, arguments: args as Record<string, unknown> });
      return r.content;
    },
  }));
}
