import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { getProject } from "@/lib/db/projects";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = getProject(projectId);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  const { command, timeoutMs = 60_000 } = await req.json();
  if (typeof command !== "string" || !command.trim()) {
    return Response.json({ error: "command required" }, { status: 400 });
  }
  const isWin = process.platform === "win32";
  const [bin, flag] = isWin ? ["powershell.exe", "-NoProfile -Command"] : ["bash", "-c"];
  return await new Promise<Response>((resolve) => {
    const child = spawn(bin, [...flag.split(" "), command], {
      cwd: p.workspacePath,
      windowsHide: true,
    });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(Response.json({
        exitCode: code ?? -1,
        stdout: stdout.slice(0, 200_000),
        stderr: stderr.slice(0, 100_000),
      }));
    });
  });
}
