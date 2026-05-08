import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDef } from "./types";

function memPath(workspace: string): string {
  return path.join(workspace, ".praxon", "memory.md");
}

export const memorySaveTool: ToolDef = {
  name: "memory_save",
  description: "Append a short fact to project memory. Use for things future sessions should remember (preferences, constraints, decisions).",
  category: "memory",
  parameters: z.object({ key: z.string(), value: z.string() }),
  run: async (args, ctx) => {
    const p = memPath(ctx.workspacePath);
    await fs.mkdir(path.dirname(p), { recursive: true });
    const line = `- **${args.key}**: ${args.value} _(${new Date().toISOString()})_\n`;
    await fs.appendFile(p, line, "utf8");
    return { saved: true };
  },
};

export const memoryReadTool: ToolDef = {
  name: "memory_read",
  description: "Read all project memory entries. Pass an empty object {} as args.",
  category: "memory",
  parameters: z.object({ _ignored: z.string().optional() }).passthrough(),
  run: async (_a, ctx) => {
    const p = memPath(ctx.workspacePath);
    const exists = await fs.stat(p).then(() => true).catch(() => false);
    if (!exists) return { content: "" };
    return { content: await fs.readFile(p, "utf8") };
  },
};

export const memoryTools = [memorySaveTool, memoryReadTool];
