import { NextRequest } from "next/server";
import { runAutonomous } from "@/lib/agents/autonomous";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const { goal, projectId, preferredProvider, maxSteps } = await req.json();
  if (!goal?.trim()) return Response.json({ error: "goal required" }, { status: 400 });
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const ev of runAutonomous({ goal, projectId, preferredProvider, maxSteps })) {
          controller.enqueue(enc.encode(JSON.stringify(ev) + "\n"));
        }
      } catch (e) {
        controller.enqueue(enc.encode(JSON.stringify({ type: "error", message: e instanceof Error ? e.message : String(e) }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
