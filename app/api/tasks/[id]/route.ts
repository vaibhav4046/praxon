import { NextRequest } from "next/server";
import { deleteTask, setTaskEnabled } from "@/lib/db/tasks";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { enabled } = await req.json();
  if (typeof enabled === "boolean") await setTaskEnabled(id, enabled);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Response.json({ ok: await deleteTask(id) });
}
