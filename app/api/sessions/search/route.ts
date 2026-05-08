import { NextRequest } from "next/server";
import { sessionsStore, messagesStore } from "@/lib/db/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return Response.json({ hits: [] });
  const sessions = sessionsStore.readSync();
  const messages = messagesStore.readSync();
  const messagesBySession = new Map<string, typeof messages>();
  for (const m of messages) {
    const arr = messagesBySession.get(m.sessionId) ?? [];
    arr.push(m);
    messagesBySession.set(m.sessionId, arr);
  }
  const hits: { id: string; title: string; snippet: string; updatedAt: number; matchType: "title" | "message" }[] = [];
  for (const s of sessions) {
    if (s.title.toLowerCase().includes(q)) {
      hits.push({ id: s.id, title: s.title, snippet: "", updatedAt: s.updatedAt, matchType: "title" });
      continue;
    }
    const msgs = messagesBySession.get(s.id) ?? [];
    const m = msgs.find((m) => m.content.toLowerCase().includes(q));
    if (m) {
      const idx = m.content.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 30);
      const end = Math.min(m.content.length, idx + q.length + 80);
      hits.push({
        id: s.id,
        title: s.title,
        snippet: (start > 0 ? "…" : "") + m.content.slice(start, end) + (end < m.content.length ? "…" : ""),
        updatedAt: s.updatedAt,
        matchType: "message",
      });
    }
  }
  hits.sort((a, b) => b.updatedAt - a.updatedAt);
  return Response.json({ hits: hits.slice(0, 50) });
}
