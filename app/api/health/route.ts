import { availableProviders } from "@/lib/llm/router";
import { promises as fs } from "node:fs";
import { getDataDir } from "@/lib/db/store";

export const runtime = "nodejs";

export async function GET() {
  const providers = availableProviders().map((p) => ({ name: p.name, free: p.free, local: p.local }));
  const dataDir = getDataDir();
  let dataDirOk = false;
  try {
    await fs.access(dataDir);
    dataDirOk = true;
  } catch { /* */ }
  const mem = process.memoryUsage();
  return Response.json({
    ok: true,
    name: "praxon",
    version: "0.1.0",
    providers,
    providerCount: providers.length,
    search: {
      tavily: Boolean(process.env.TAVILY_API_KEY),
      serper: Boolean(process.env.SERPER_API_KEY),
      brave: Boolean(process.env.BRAVE_SEARCH_API_KEY),
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      uptimeSec: Math.floor(process.uptime()),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapMB: Math.round(mem.heapUsed / 1024 / 1024),
    },
    storage: { dataDir, ok: dataDirOk },
  });
}
