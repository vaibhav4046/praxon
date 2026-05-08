import { z } from "zod";
import type { ToolDef } from "./types";
import { ToolError } from "./types";

type SearchHit = { title: string; url: string; snippet: string };

async function tavilySearch(query: string, max: number): Promise<SearchHit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new ToolError("web_search", "Set TAVILY_API_KEY or SERPER_API_KEY or BRAVE_SEARCH_API_KEY");
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: max, search_depth: "basic" }),
  });
  if (!r.ok) throw new ToolError("web_search", `Tavily ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { results?: { title: string; url: string; content: string }[] };
  return (j.results ?? []).map((h) => ({ title: h.title, url: h.url, snippet: h.content }));
}

async function serperSearch(query: string, max: number): Promise<SearchHit[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  const r = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: max }),
  });
  if (!r.ok) throw new ToolError("web_search", `Serper ${r.status}`);
  const j = (await r.json()) as { organic?: { title: string; link: string; snippet: string }[] };
  return (j.organic ?? []).map((h) => ({ title: h.title, url: h.link, snippet: h.snippet }));
}

async function braveSearch(query: string, max: number): Promise<SearchHit[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return [];
  const u = new URL("https://api.search.brave.com/res/v1/web/search");
  u.searchParams.set("q", query);
  u.searchParams.set("count", String(max));
  const r = await fetch(u, { headers: { "X-Subscription-Token": key, Accept: "application/json" } });
  if (!r.ok) throw new ToolError("web_search", `Brave ${r.status}`);
  const j = (await r.json()) as { web?: { results?: { title: string; url: string; description: string }[] } };
  return (j.web?.results ?? []).map((h) => ({ title: h.title, url: h.url, snippet: h.description }));
}

export const webSearchTool: ToolDef = {
  name: "web_search",
  description: "Search the public web. Uses Tavily, Serper, or Brave. Returns title/url/snippet for each hit.",
  category: "web",
  parameters: z.object({
    query: z.string().describe("The search query."),
    maxResults: z.number().int().optional().describe("Number of results (1-20). Default 8."),
  }),
  run: async (args) => {
    const max = Math.max(1, Math.min(20, args.maxResults ?? 8));
    const tries = [tavilySearch, serperSearch, braveSearch];
    let lastErr: unknown;
    for (const fn of tries) {
      try {
        const hits = await fn(args.query, max);
        if (hits.length) return { provider: fn.name.replace("Search", ""), query: args.query, hits };
      } catch (e) {
        lastErr = e;
      }
    }
    return {
      __error: "No web search provider configured.",
      hint: "Set TAVILY_API_KEY (free 1000/mo at https://tavily.com), SERPER_API_KEY, or BRAVE_SEARCH_API_KEY in .env.local.",
      lastError: String(lastErr ?? "no providers tried"),
      hits: [],
    };
  },
};

export const fetchUrlTool: ToolDef = {
  name: "fetch_url",
  description: "HTTP GET a URL. Returns status, headers, and a (possibly truncated) text body.",
  category: "http",
  parameters: z.object({
    url: z.string().url(),
    maxBytes: z.number().int().positive().max(2_000_000).default(300_000),
    headers: z.record(z.string()).optional(),
  }),
  run: async (args) => {
    const r = await fetch(args.url, {
      headers: { "User-Agent": "Praxon/0.1 (+https://github.com/praxon)", ...(args.headers ?? {}) },
    });
    const text = await r.text();
    const truncated = text.length > args.maxBytes;
    return {
      url: args.url,
      status: r.status,
      ok: r.ok,
      contentType: r.headers.get("content-type") ?? "",
      truncated,
      body: truncated ? text.slice(0, args.maxBytes) : text,
    };
  },
};

export const webTools = [webSearchTool, fetchUrlTool];
