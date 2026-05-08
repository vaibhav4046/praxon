import "server-only";
import { promises as fs } from "node:fs";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

export function getDataDir(): string {
  const custom = process.env.PRAXON_DATA_DIR;
  if (custom) return custom;
  return path.join(os.homedir(), ".praxon");
}

const dataDir = getDataDir();
fsSync.mkdirSync(dataDir, { recursive: true });
fsSync.mkdirSync(path.join(dataDir, "workspaces"), { recursive: true });

type Json = Record<string, unknown> | unknown[];

class JsonStore<T extends Json> {
  private path: string;
  private cache: T | null = null;
  private writePromise: Promise<void> = Promise.resolve();
  private dirty = false;

  constructor(name: string, private defaultValue: T) {
    this.path = path.join(dataDir, `${name}.json`);
  }

  async read(): Promise<T> {
    if (this.cache) return this.cache;
    return this.readSync();
  }

  readSync(): T {
    if (this.cache) return this.cache;
    try {
      const txt = fsSync.readFileSync(this.path, "utf8");
      this.cache = JSON.parse(txt) as T;
    } catch {
      this.cache = JSON.parse(JSON.stringify(this.defaultValue)) as T;
    }
    return this.cache!;
  }

  /** Atomic write, queued so concurrent writes serialize. Updates cache immediately. */
  writeSync(data: T): void {
    this.cache = data;
    this.dirty = true;
    // Schedule async flush, chained to prevent races
    this.writePromise = this.writePromise.then(async () => {
      if (!this.dirty) return;
      this.dirty = false;
      const snapshot = this.cache!;
      const tmp = `${this.path}.${process.pid}.${Date.now()}.tmp`;
      try {
        await fs.writeFile(tmp, JSON.stringify(snapshot, null, 2), "utf8");
        await fs.rename(tmp, this.path);
      } catch (e) {
        try { await fs.unlink(tmp); } catch { /* */ }
        if (process.env.NODE_ENV !== "production") console.error(`[praxon store ${this.path}] write failed:`, e);
      }
    });
    // Also do an immediate sync write so reads on a new process see fresh data on crash
    try {
      const tmp = `${this.path}.sync.tmp`;
      fsSync.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
      fsSync.renameSync(tmp, this.path);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(`[praxon store ${this.path}] sync write failed:`, e);
    }
  }

  /** Wait for any pending async writes (used in tests / shutdown). */
  async flush(): Promise<void> {
    await this.writePromise;
  }
}

export type ProjectRow = {
  id: string; name: string; description: string; systemPrompt: string;
  workspacePath: string; memory: string[]; skills: string[];
  mcpServers: string[]; createdAt: number; updatedAt: number;
};

export type SessionRow = {
  id: string; projectId: string | null; title: string;
  pinnedModel: string | null; createdAt: number; updatedAt: number;
};

export type MessageRow = {
  id: string; sessionId: string; role: string; content: string;
  toolCalls: unknown[]; attachments: unknown[];
  provider: string | null; model: string | null; createdAt: number;
};

export type SkillRow = {
  id: string; name: string; description: string; trigger: string;
  systemPrompt: string; toolWhitelist: string[]; createdAt: number;
};

export type TaskRow = {
  id: string; name: string; cron: string; prompt: string;
  projectId: string | null; enabled: boolean;
  lastRun: number | null; nextRun: number | null; createdAt: number;
};

export type McpRow = {
  id: string; name: string; command: string; args: string[];
  env: Record<string, string>; enabled: boolean; createdAt: number;
};

export const projectsStore = new JsonStore<ProjectRow[]>("projects", []);
export const sessionsStore = new JsonStore<SessionRow[]>("sessions", []);
export const messagesStore = new JsonStore<MessageRow[]>("messages", []);
export const skillsStore = new JsonStore<SkillRow[]>("skills", []);
export const tasksStore = new JsonStore<TaskRow[]>("tasks", []);
export const mcpStore = new JsonStore<McpRow[]>("mcp", []);

export async function ensureWorkspace(projectId: string): Promise<string> {
  const wsRoot = path.join(getDataDir(), "workspaces", projectId);
  await fs.mkdir(wsRoot, { recursive: true });
  return wsRoot;
}
