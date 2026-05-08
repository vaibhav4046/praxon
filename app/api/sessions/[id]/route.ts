import { NextRequest } from "next/server";
import { getSessionAsync, updateSessionTitle, deleteSession } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await getSessionAsync(id);
  if (!s) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ session: s });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { title } = await req.json();
  if (typeof title === "string") await updateSessionTitle(id, title);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Response.json({ ok: await deleteSession(id) });
}
