import { NextRequest } from "next/server";
import { listMcpServers, createMcpServer } from "@/lib/db/mcp";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ servers: await listMcpServers() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || !body?.command) {
    return Response.json({ error: "name & command required" }, { status: 400 });
  }
  const server = await createMcpServer({
    name: body.name, command: body.command,
    args: Array.isArray(body.args) ? body.args : [],
    env: body.env ?? {},
    enabled: body.enabled !== false,
  });
  return Response.json({ server }, { status: 201 });
}
