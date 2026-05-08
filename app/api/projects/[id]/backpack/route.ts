import { NextRequest } from "next/server";
import { listBackpack, addBackpackFile, addBackpackNote } from "@/lib/db/backpack";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Response.json({ items: await listBackpack(id) });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "file required" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const item = await addBackpackFile(id, { name: file.name, mime: file.type, bytes });
    if (!item) return Response.json({ error: "project not found" }, { status: 404 });
    return Response.json({ item }, { status: 201 });
  } else {
    const { name, content } = await req.json();
    if (typeof content !== "string") return Response.json({ error: "content required" }, { status: 400 });
    const item = await addBackpackNote(id, name ?? "Note", content);
    if (!item) return Response.json({ error: "project not found" }, { status: 404 });
    return Response.json({ item }, { status: 201 });
  }
}
