import { z } from "zod";
import { spawn } from "node:child_process";
import type { ToolDef } from "./types";
import { ToolError } from "./types";

const BANNED = [/\brm\s+-rf\s+\/\b/, /\bmkfs\b/, /\b:\(\)\s*\{/, /\bdd\s+if=/, /\bshutdown\b/, /\breboot\b/];

const PLATFORM_HINT = process.platform === "win32"
  ? "RUNNING ON WINDOWS — bash is NOT available. Default to powershell. Use POSIX-compatible syntax (ls, cat) only with the cmd shell sparingly. Prefer powershell."
  : "RUNNING ON UNIX — bash is the default.";

export const shellTool: ToolDef = {
  name: "shell",
  description: `Run a shell command in the project workspace. Returns stdout, stderr, exit code. Long-running commands time out. ${PLATFORM_HINT}`,
  category: "shell",
  destructive: true,
  needsConfirmation: false,
  parameters: z.object({
    command: z.string().describe("Shell command to execute."),
    timeoutMs: z.number().int().positive().max(120_000).default(30_000),
    shell: z.enum(["bash", "powershell", "cmd"]).optional().describe(process.platform === "win32" ? "Default and recommended on Windows: 'powershell'. Do NOT pick 'bash' on Windows." : "Default: 'bash'."),
  }),
  run: async (args, ctx) => {
    if (BANNED.some((r) => r.test(args.command))) {
      throw new ToolError("shell", "Banned destructive pattern detected");
    }
    const isWin = process.platform === "win32";
    const shell = args.shell ?? (isWin ? "powershell" : "bash");
    const [bin, flag] =
      shell === "powershell" ? ["powershell.exe", "-NoProfile -Command"] :
      shell === "cmd" ? ["cmd.exe", "/c"] :
      ["bash", "-c"];

    return await new Promise((resolve, reject) => {
      const child = spawn(bin, [...flag.split(" "), args.command], {
        cwd: ctx.workspacePath,
        env: { ...process.env, PRAXON_SESSION: ctx.sessionId },
        windowsHide: true,
      });
      let stdout = "", stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new ToolError("shell", `Timed out after ${args.timeoutMs}ms`));
      }, args.timeoutMs);
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(new ToolError("shell", e.message, e));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? -1,
          stdout: stdout.slice(0, 100_000),
          stderr: stderr.slice(0, 50_000),
          truncated: stdout.length > 100_000 || stderr.length > 50_000,
        });
      });
      ctx.abortSignal?.addEventListener("abort", () => {
        clearTimeout(timer);
        child.kill("SIGTERM");
        reject(new ToolError("shell", "Aborted"));
      });
    });
  },
};

export const shellTools = [shellTool];
