import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDef } from "./types";
import { ToolError } from "./types";

function resolveSafe(workspace: string, rel: string): string {
  const abs = path.resolve(workspace, rel);
  const wsAbs = path.resolve(workspace);
  if (!abs.startsWith(wsAbs)) {
    throw new ToolError("fs", `Path "${rel}" escapes workspace`);
  }
  return abs;
}

export const readFileTool: ToolDef = {
  name: "read_file",
  description: "Read a UTF-8 text file from the project workspace. Returns the file contents.",
  category: "fs",
  parameters: z.object({
    path: z.string().describe("Path relative to workspace root."),
    maxBytes: z.number().int().positive().max(2_000_000).optional().default(200_000),
  }),
  run: async (args, ctx) => {
    const abs = resolveSafe(ctx.workspacePath, args.path);
    const stat = await fs.stat(abs).catch(() => null);
    if (!stat) throw new ToolError("read_file", `Not found: ${args.path}`);
    if (stat.size > args.maxBytes!) {
      const fh = await fs.open(abs, "r");
      try {
        const buf = Buffer.alloc(args.maxBytes!);
        await fh.read(buf, 0, args.maxBytes!, 0);
        return { path: args.path, truncated: true, size: stat.size, content: buf.toString("utf8") };
      } finally {
        await fh.close();
      }
    }
    const content = await fs.readFile(abs, "utf8");
    return { path: args.path, truncated: false, size: stat.size, content };
  },
};

export const writeFileTool: ToolDef = {
  name: "write_file",
  description: "Create or overwrite a text file in the workspace. Creates parent dirs as needed.",
  category: "fs",
  destructive: true,
  parameters: z.object({
    path: z.string(),
    content: z.string(),
  }),
  run: async (args, ctx) => {
    const abs = resolveSafe(ctx.workspacePath, args.path);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, args.content, "utf8");
    return { path: args.path, bytes: Buffer.byteLength(args.content, "utf8") };
  },
};

export const editFileTool: ToolDef = {
  name: "edit_file",
  description: "Replace exact string in a file. old_string must be unique. Use this for surgical edits.",
  category: "fs",
  destructive: true,
  parameters: z.object({
    path: z.string(),
    old_string: z.string(),
    new_string: z.string(),
  }),
  run: async (args, ctx) => {
    const abs = resolveSafe(ctx.workspacePath, args.path);
    const cur = await fs.readFile(abs, "utf8");
    const occurrences = cur.split(args.old_string).length - 1;
    if (occurrences === 0) throw new ToolError("edit_file", "old_string not found");
    if (occurrences > 1) throw new ToolError("edit_file", `old_string matches ${occurrences} times — make it unique`);
    const next = cur.replace(args.old_string, args.new_string);
    await fs.writeFile(abs, next, "utf8");
    return { path: args.path, occurrences };
  },
};

export const listDirTool: ToolDef = {
  name: "list_dir",
  description: "List files and dirs at a workspace-relative path.",
  category: "fs",
  parameters: z.object({
    path: z.string().default("."),
    maxEntries: z.number().int().positive().max(2000).default(500),
  }),
  run: async (args, ctx) => {
    const abs = resolveSafe(ctx.workspacePath, args.path);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    return {
      path: args.path,
      entries: entries.slice(0, args.maxEntries).map((e) => ({
        name: e.name,
        type: e.isDirectory() ? "dir" : e.isFile() ? "file" : "other",
      })),
      total: entries.length,
    };
  },
};

export const deleteFileTool: ToolDef = {
  name: "delete_file",
  description: "Delete a file or empty dir. Requires user confirmation.",
  category: "fs",
  destructive: true,
  needsConfirmation: true,
  parameters: z.object({ path: z.string() }),
  run: async (args, ctx) => {
    const abs = resolveSafe(ctx.workspacePath, args.path);
    await fs.rm(abs, { recursive: false });
    return { path: args.path, deleted: true };
  },
};

export const fsTools = [readFileTool, writeFileTool, editFileTool, listDirTool, deleteFileTool];
