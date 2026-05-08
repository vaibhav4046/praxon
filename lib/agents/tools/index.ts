import type { ToolDef, ToolRegistry } from "./types";
import { fsTools } from "./fs";
import { shellTools } from "./shell";
import { webTools } from "./web";
import { browserTools } from "./browser";
import { memoryTools } from "./memory";

export function buildRegistry(): ToolRegistry {
  const all: ToolDef[] = [...fsTools, ...shellTools, ...webTools, ...browserTools, ...memoryTools];
  const reg: ToolRegistry = {};
  for (const t of all) reg[t.name] = t;
  return reg;
}

export function listToolNames(reg: ToolRegistry): string[] {
  return Object.keys(reg).sort();
}

export type { ToolDef, ToolContext, ToolRegistry } from "./types";
export { ToolError } from "./types";
