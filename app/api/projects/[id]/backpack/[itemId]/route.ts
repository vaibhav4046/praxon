import { NextRequest } from "next/server";
import { deleteBackpackItem, setPinned } from "@/lib/db/backpack";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await ctx.params;
  const { pinned } = await req.json();
  if (typeof pinned === "boolean") await setPinned(id, itemId, pinned);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await ctx.params;
  return Response.json({ ok: await deleteBackpackItem(id, itemId) });
}
