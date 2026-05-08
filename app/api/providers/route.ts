import { availableProviders } from "@/lib/llm/router";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    providers: availableProviders().map((p) => ({ name: p.name, free: p.free, local: p.local })),
  });
}
