import { NextRequest } from "next/server";
import { listArtifacts, createArtifact } from "@/lib/db/artifacts";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? undefined;
  return Response.json({ artifacts: await listArtifacts(sessionId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.sessionId || !body?.kind || !body?.title || typeof body?.content !== "string") {
    return Response.json({ error: "sessionId, kind, title, content required" }, { status: 400 });
  }
  const a = await createArtifact({
    sessionId: body.sessionId,
    kind: body.kind,
    language: body.language,
    title: body.title,
    content: body.content,
  });
  return Response.json({ artifact: a }, { status: 201 });
}
