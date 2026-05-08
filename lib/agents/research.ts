import "server-only";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { availableProviders, pickByName, pickPrimary } from "../llm/router";
import { webSearchTool, fetchUrlTool } from "./tools/web";

const PlanSchema = z.object({
  intent: z.string().describe("One-line restatement of the user's research goal."),
  subqueries: z.array(z.string()).min(2).max(8).describe("Targeted web search queries that together cover the goal."),
});

export type ResearchEvent =
  | { type: "plan"; intent: string; subqueries: string[] }
  | { type: "search"; query: string; results: { title: string; url: string; snippet: string }[] }
  | { type: "fetch"; url: string; ok: boolean; bytes: number }
  | { type: "synthesis"; markdown: string; sources: { url: string; title: string }[] }
  | { type: "error"; message: string };

export async function* runDeepResearch(opts: {
  query: string;
  preferredProvider?: string;
  maxSubqueries?: number;
  maxFetchPerQuery?: number;
}): AsyncGenerator<ResearchEvent> {
  const all = availableProviders();
  if (all.length === 0) {
    yield { type: "error", message: "No LLM providers configured. Add a free API key in .env.local." };
    return;
  }
  const entry = (opts.preferredProvider && pickByName(opts.preferredProvider)) || pickPrimary();

  // 1) Plan
  let plan: z.infer<typeof PlanSchema>;
  try {
    const r = await generateObject({
      model: entry.model,
      schema: PlanSchema,
      prompt: `Plan a deep web research over the user's question. Generate ${opts.maxSubqueries ?? 5} diverse, targeted web search queries (mix of broad + narrow). User question:\n\n${opts.query}`,
    });
    plan = r.object;
  } catch (e) {
    yield { type: "error", message: `Plan failed: ${e instanceof Error ? e.message : String(e)}` };
    return;
  }
  yield { type: "plan", intent: plan.intent, subqueries: plan.subqueries };

  // 2) Search + fetch top results
  const collected: { url: string; title: string; snippet: string; body: string }[] = [];
  const seen = new Set<string>();
  const fetchPerQ = opts.maxFetchPerQuery ?? 3;

  for (const q of plan.subqueries) {
    let hits: { title: string; url: string; snippet: string }[] = [];
    try {
      const r = (await webSearchTool.run({ query: q, maxResults: 6 }, { projectId: null, workspacePath: process.cwd(), sessionId: "research" })) as { hits?: typeof hits };
      hits = r.hits ?? [];
    } catch (e) {
      yield { type: "error", message: `Search failed for "${q}": ${e instanceof Error ? e.message : String(e)}` };
      continue;
    }
    yield { type: "search", query: q, results: hits };
    let fetchedForQ = 0;
    for (const h of hits) {
      if (fetchedForQ >= fetchPerQ) break;
      if (seen.has(h.url)) continue;
      seen.add(h.url);
      try {
        const r = (await fetchUrlTool.run({ url: h.url, maxBytes: 80_000 }, { projectId: null, workspacePath: process.cwd(), sessionId: "research" })) as { ok: boolean; body: string };
        yield { type: "fetch", url: h.url, ok: r.ok, bytes: r.body.length };
        if (r.ok) {
          collected.push({ url: h.url, title: h.title, snippet: h.snippet, body: r.body.slice(0, 6000) });
          fetchedForQ++;
        }
      } catch (e) {
        yield { type: "fetch", url: h.url, ok: false, bytes: 0 };
        void e;
      }
    }
  }

  if (collected.length === 0) {
    yield { type: "error", message: "No sources fetched successfully. Check TAVILY_API_KEY / SERPER_API_KEY." };
    return;
  }

  // 3) Synthesize w/ inline source citations [n]
  const sourcesBlock = collected.map((c, i) => `[${i + 1}] ${c.title}\nURL: ${c.url}\n---\n${c.body.replace(/\s+/g, " ").slice(0, 2400)}`).join("\n\n");
  const synth = await generateText({
    model: entry.model,
    system: `You are a deep-research analyst. Write a thorough, neutral, well-structured markdown report with section headers and inline citations like [1], [2]. Do NOT invent facts beyond what the sources say. End with a "## Sources" section listing each [n] -> URL.`,
    prompt: `Research goal: ${plan.intent}\n\nSources (use [n] citations):\n\n${sourcesBlock}\n\nWrite the report now.`,
  });

  yield {
    type: "synthesis",
    markdown: synth.text,
    sources: collected.map((c) => ({ url: c.url, title: c.title })),
  };
}
