import { listProjects, deleteProject } from "@/lib/db/projects";
import { sessionsStore, messagesStore } from "@/lib/db/store";

export const runtime = "nodejs";

export async function POST() {
  const projects = listProjects();
  // Group by name; keep oldest per name (smallest createdAt). Reassign sessions of removed projects to surviving project of same name.
  const byName = new Map<string, typeof projects>();
  for (const p of projects) {
    const arr = byName.get(p.name) ?? [];
    arr.push(p);
    byName.set(p.name, arr);
  }
  let removed = 0;
  let reassigned = 0;
  const sess = sessionsStore.readSync();
  const msgs = messagesStore.readSync();
  for (const [, arr] of byName) {
    if (arr.length <= 1) continue;
    const sorted = [...arr].sort((a, b) => a.createdAt - b.createdAt);
    const keep = sorted[0]!;
    for (let i = 1; i < sorted.length; i++) {
      const drop = sorted[i]!;
      // reassign sessions
      for (const s of sess) {
        if (s.projectId === drop.id) {
          s.projectId = keep.id;
          reassigned++;
        }
      }
      // workspace dirs left on disk untouched; only db row removed
      if (await deleteProject(drop.id)) removed++;
    }
  }
  sessionsStore.writeSync(sess);
  void msgs; // unchanged
  return Response.json({ ok: true, removed, reassigned, kept: byName.size });
}
