import { NextRequest } from "next/server";
import { runDeepResearch } from "@/lib/agents/research";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { query, preferredProvider, maxSubqueries, maxFetchPerQuery } = await req.json();
  if (!query?.trim()) return Response.json({ error: "query required" }, { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const ev of runDeepResearch({ query, preferredProvider, maxSubqueries, maxFetchPerQuery })) {
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
