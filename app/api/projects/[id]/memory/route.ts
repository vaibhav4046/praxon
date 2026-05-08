import { NextRequest } from "next/server";
import { readMemory, writeMemory } from "@/lib/db/memory";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Response.json({ content: await readMemory(id) });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { content } = await req.json();
  if (typeof content !== "string") return Response.json({ error: "content required" }, { status: 400 });
  return Response.json({ ok: await writeMemory(id, content) });
}
