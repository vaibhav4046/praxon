import { NextRequest } from "next/server";
import { getSkill, deleteSkill } from "@/lib/db/skills";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = getSkill(id);
  if (!s) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ skill: s });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Response.json({ ok: await deleteSkill(id) });
}
