import "server-only";
import { promises as fs } from "node:fs";
import fsSync from "node:fs";
import path from "node:path";
import { getDataDir } from "./store";

const KEYS_FILE = path.join(getDataDir(), "runtime-env.json");

export const KNOWN_KEYS = [
  "GROQ_API_KEY", "GROQ_MODEL",
  "GEMINI_API_KEY", "GEMINI_MODEL",
  "CEREBRAS_API_KEY", "CEREBRAS_MODEL",
  "TOGETHER_API_KEY", "TOGETHER_MODEL",
  "OPENROUTER_API_KEY", "OPENROUTER_MODEL",
  "NVIDIA_NIM_API_KEY", "NVIDIA_NIM_MODEL",
  "HUGGINGFACE_API_KEY", "HF_MODEL",
  "OLLAMA_ENABLED", "OLLAMA_BASE_URL", "OLLAMA_MODEL",
  "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL",
  "OPENAI_API_KEY", "OPENAI_MODEL",
  "TAVILY_API_KEY", "SERPER_API_KEY", "BRAVE_SEARCH_API_KEY",
] as const;
export type KnownKey = typeof KNOWN_KEYS[number];

let cache: Record<string, string> | null = null;

function loadFromDisk(): Record<string, string> {
  try {
    return JSON.parse(fsSync.readFileSync(KEYS_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

export function applyRuntimeEnv() {
  if (cache) return;
  cache = loadFromDisk();
  for (const [k, v] of Object.entries(cache)) {
    if (typeof v === "string" && v.length > 0) {
      // Set even if .env already provides — runtime store wins
      process.env[k] = v;
    }
  }
}

export async function setRuntimeEnv(key: string, value: string): Promise<void> {
  if (!KNOWN_KEYS.includes(key as KnownKey)) throw new Error(`Unknown key: ${key}`);
  applyRuntimeEnv();
  const next = { ...(cache ?? {}), [key]: value };
  cache = next;
  process.env[key] = value;
  await fs.mkdir(path.dirname(KEYS_FILE), { recursive: true });
  await fs.writeFile(KEYS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function deleteRuntimeEnv(key: string): Promise<void> {
  applyRuntimeEnv();
  const next = { ...(cache ?? {}) };
  delete next[key];
  cache = next;
  delete process.env[key];
  await fs.writeFile(KEYS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export function getRuntimeEnv(): Record<string, string> {
  applyRuntimeEnv();
  return cache ?? {};
}

// Auto-load on module import
applyRuntimeEnv();
