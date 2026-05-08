import { NextRequest } from "next/server";
import { getRuntimeEnv, setRuntimeEnv, deleteRuntimeEnv, KNOWN_KEYS } from "@/lib/db/runtime-env";
import { availableProviders } from "@/lib/llm/router";

export const runtime = "nodejs";

function maskValue(v: string): string {
  if (!v) return "";
  if (v.length <= 8) return "•".repeat(v.length);
  return v.slice(0, 4) + "•".repeat(Math.max(4, v.length - 8)) + v.slice(-4);
}

export async function GET() {
  const env = getRuntimeEnv();
  const fromEnvFile: Record<string, boolean> = {};
  for (const k of KNOWN_KEYS) {
    fromEnvFile[k] = Boolean(process.env[k]);
  }
  const masked: Record<string, string> = {};
  for (const k of KNOWN_KEYS) {
    masked[k] = env[k] ? maskValue(env[k]) : "";
  }
  return Response.json({
    keys: masked,
    set: fromEnvFile,
    knownKeys: KNOWN_KEYS,
    providers: availableProviders().map((p) => ({ name: p.name, free: p.free, local: p.local })),
  });
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json();
  if (typeof key !== "string" || typeof value !== "string") {
    return Response.json({ error: "key & value required" }, { status: 400 });
  }
  if (!(KNOWN_KEYS as readonly string[]).includes(key)) {
    return Response.json({ error: `unknown key: ${key}` }, { status: 400 });
  }
  await setRuntimeEnv(key, value);
  return Response.json({ ok: true, providers: availableProviders().map((p) => p.name) });
}

export async function DELETE(req: NextRequest) {
  const { key } = await req.json();
  if (typeof key !== "string") return Response.json({ error: "key required" }, { status: 400 });
  await deleteRuntimeEnv(key);
  return Response.json({ ok: true, providers: availableProviders().map((p) => p.name) });
}
