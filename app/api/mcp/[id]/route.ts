import { NextRequest } from "next/server";
import { setMcpEnabled, deleteMcpServer } from "@/lib/db/mcp";
import { disconnectMcp } from "@/lib/mcp/client";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { enabled } = await req.json();
  if (typeof enabled === "boolean") {
    await setMcpEnabled(id, enabled);
    if (!enabled) await disconnectMcp(id).catch(() => {});
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await disconnectMcp(id).catch(() => {});
  return Response.json({ ok: await deleteMcpServer(id) });
}
