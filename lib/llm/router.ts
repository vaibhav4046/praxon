import "server-only";
import type { LanguageModelV1 } from "ai";
import { getNvidiaNimModel, NVIDIA_NIM_NAME } from "./providers/nvidia-nim";
import { getGroqModel, GROQ_NAME } from "./providers/groq";
import { getCerebrasModel, CEREBRAS_NAME } from "./providers/cerebras";
import { getOpenRouterModel, OPENROUTER_NAME } from "./providers/openrouter";
import { getGeminiModel, GEMINI_NAME } from "./providers/gemini";
import { getTogetherModel, TOGETHER_NAME } from "./providers/together";
import { getOllamaModel, OLLAMA_NAME } from "./providers/ollama";
import { getHuggingFaceModel, HF_NAME } from "./providers/huggingface";
import { getAnthropicModel, ANTHROPIC_NAME } from "./providers/anthropic";
import { getOpenAIModel, OPENAI_NAME } from "./providers/openai";

export type ProviderEntry = {
  name: string;
  model: LanguageModelV1;
  free: boolean;
  local: boolean;
};

export class AllProvidersExhaustedError extends Error {
  constructor(public attempts: { name: string; error: string }[]) {
    super(
      `All free LLM providers exhausted. Add an API key in .env or run Ollama locally.\nAttempts:\n${attempts
        .map((a) => `  - ${a.name}: ${a.error}`)
        .join("\n")}`
    );
  }
}

export function availableProviders(): ProviderEntry[] {
  const entries: ProviderEntry[] = [];
  // Premium first when user provides keys (best quality)
  const anthropic = getAnthropicModel();
  if (anthropic) entries.push({ name: ANTHROPIC_NAME, model: anthropic, free: false, local: false });
  const openai = getOpenAIModel();
  if (openai) entries.push({ name: OPENAI_NAME, model: openai, free: false, local: false });
  // Local + free providers
  const ollama = getOllamaModel();
  if (ollama) entries.push({ name: OLLAMA_NAME, model: ollama, free: true, local: true });
  const groq = getGroqModel();
  if (groq) entries.push({ name: GROQ_NAME, model: groq, free: true, local: false });
  const cerebras = getCerebrasModel();
  if (cerebras) entries.push({ name: CEREBRAS_NAME, model: cerebras, free: true, local: false });
  const gemini = getGeminiModel();
  if (gemini) entries.push({ name: GEMINI_NAME, model: gemini, free: true, local: false });
  const together = getTogetherModel();
  if (together) entries.push({ name: TOGETHER_NAME, model: together, free: true, local: false });
  const nvidia = getNvidiaNimModel();
  if (nvidia) entries.push({ name: NVIDIA_NIM_NAME, model: nvidia, free: true, local: false });
  const hf = getHuggingFaceModel();
  if (hf) entries.push({ name: HF_NAME, model: hf, free: true, local: false });
  const openrouter = getOpenRouterModel();
  if (openrouter) entries.push({ name: OPENROUTER_NAME, model: openrouter, free: true, local: false });
  return entries;
}

export function pickByName(name: string): ProviderEntry | null {
  return availableProviders().find((p) => p.name === name) ?? null;
}

export function pickPrimary(): ProviderEntry {
  const all = availableProviders();
  if (all.length === 0) {
    throw new AllProvidersExhaustedError([
      { name: "*", error: "No providers configured. Set GROQ_API_KEY, GEMINI_API_KEY, etc., or run Ollama." },
    ]);
  }
  return all[0]!;
}

export async function withFallback<T>(
  fn: (entry: ProviderEntry) => Promise<T>,
  preferred?: string
): Promise<{ result: T; provider: string }> {
  const all = availableProviders();
  if (all.length === 0) {
    throw new AllProvidersExhaustedError([{ name: "*", error: "No providers configured." }]);
  }
  const ordered = preferred
    ? [...all.filter((p) => p.name === preferred), ...all.filter((p) => p.name !== preferred)]
    : all;
  const attempts: { name: string; error: string }[] = [];
  for (const p of ordered) {
    try {
      const result = await fn(p);
      return { result, provider: p.name };
    } catch (err) {
      const e = err as { status?: number; statusCode?: number; message?: string };
      const status = e.status ?? e.statusCode;
      const retryable = status === 429 || (status !== undefined && status >= 500) || status === undefined;
      attempts.push({ name: p.name, error: `${status ?? "?"} ${e.message ?? String(err)}` });
      if (!retryable) throw err;
    }
  }
  throw new AllProvidersExhaustedError(attempts);
}
