import { z } from "zod";

export type ToolContext = {
  projectId: string | null;
  workspacePath: string;
  sessionId: string;
  abortSignal?: AbortSignal;
};

export type ToolDef<P extends z.ZodTypeAny = z.ZodTypeAny, R = unknown> = {
  name: string;
  description: string;
  category: "fs" | "shell" | "web" | "http" | "browser" | "memory" | "skill" | "mcp";
  parameters: P;
  destructive?: boolean;
  needsConfirmation?: boolean;
  run: (args: z.infer<P>, ctx: ToolContext) => Promise<R>;
};

export type ToolRegistry = Record<string, ToolDef>;

export class ToolError extends Error {
  public toolName: string;
  public override cause?: unknown;
  constructor(toolName: string, message: string, cause?: unknown) {
    super(`[${toolName}] ${message}`);
    this.toolName = toolName;
    this.cause = cause;
  }
}
