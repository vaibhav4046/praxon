import { NextRequest } from "next/server";
import { listSkillsAsync, createSkill } from "@/lib/db/skills";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ skills: await listSkillsAsync() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || !body?.systemPrompt) {
    return Response.json({ error: "name & systemPrompt required" }, { status: 400 });
  }
  const skill = await createSkill({
    name: body.name,
    description: body.description ?? "",
    trigger: body.trigger ?? "",
    systemPrompt: body.systemPrompt,
    toolWhitelist: body.toolWhitelist ?? [],
  });
  return Response.json({ skill }, { status: 201 });
}
