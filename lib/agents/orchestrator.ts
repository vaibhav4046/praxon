import "server-only";
import { streamText, tool, type CoreMessage, type StreamTextResult } from "ai";
import { z } from "zod";
import { availableProviders, pickByName, pickPrimary, AllProvidersExhaustedError } from "../llm/router";
import { buildRegistry, type ToolContext, type ToolRegistry } from "./tools";

export type RunInput = {
  messages: CoreMessage[];
  systemPrompt?: string;
  extraSystem?: string;
  preferredProvider?: string;
  toolContext: ToolContext;
  enabledTools?: string[];
  maxSteps?: number;
};

function toAiSdkTools(reg: ToolRegistry, ctx: ToolContext, allow?: string[]) {
  const out: Record<string, unknown> = {};
  for (const [name, def] of Object.entries(reg)) {
    if (allow && allow.length && !allow.includes(name)) continue;
    out[name] = tool({
      description: def.description,
      parameters: def.parameters as z.ZodTypeAny,
      execute: async (args: unknown) => {
        try {
          return await def.run(args, ctx);
        } catch (e) {
          return { __error: e instanceof Error ? e.message : String(e) };
        }
      },
    });
  }
  return out as Record<string, ReturnType<typeof tool>>;
}

const DEFAULT_SYSTEM = `You are Praxon — an open-source AI agent. You help users with coding, research, automation, and computer tasks.

Style: concise, direct. Skip filler.
Tools: prefer them over guessing. Confirm before destructive actions.
Free LLMs: you may run on Groq, Gemini, Cerebras, Together, Ollama, etc. Quality varies.
Workspace: a per-project sandboxed directory. fs tools are scoped to it.
Browser: real Playwright Chromium for web tasks.
Memory: save important facts via memory_save so future sessions know.`;

function isRateLimitOrTransient(err: unknown): boolean {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e?.status ?? e?.statusCode;
  if (status === 429) return true;
  if (status !== undefined && status >= 500) return true;
  const msg = (e?.message ?? "").toLowerCase();
  return msg.includes("rate limit") || msg.includes("tpm") || msg.includes("429") || msg.includes("overloaded") || msg.includes("timeout");
}

export async function runAgent(input: RunInput): Promise<{ result: StreamTextResult<Record<string, ReturnType<typeof tool>>, never>; provider: string }> {
  const reg = buildRegistry();
  const tools = toAiSdkTools(reg, input.toolContext, input.enabledTools);
  const baseSystem = input.systemPrompt?.trim() || DEFAULT_SYSTEM;
  const finalSystem = input.extraSystem?.trim() ? `${baseSystem}\n\n${input.extraSystem.trim()}` : baseSystem;

  const all = availableProviders();
  if (all.length === 0) throw new AllProvidersExhaustedError([{ name: "*", error: "No providers configured." }]);

  const ordered = input.preferredProvider
    ? [...all.filter((p) => p.name === input.preferredProvider), ...all.filter((p) => p.name !== input.preferredProvider)]
    : all;

  const attempts: { name: string; error: string }[] = [];
  for (const entry of ordered) {
    try {
      const result = streamText({
        model: entry.model,
        system: finalSystem,
        messages: input.messages,
        tools,
        maxSteps: input.maxSteps ?? 10,
        abortSignal: input.toolContext.abortSignal,
        onError: (ev) => {
          if (process.env.NODE_ENV !== "production") console.error("[praxon] stream error:", ev);
        },
      });
      // Trigger first chunk to detect immediate provider failure (auth, rate-limit) early.
      const probe = await Promise.race([
        result.warnings.then(() => "ok").catch((e) => ({ err: e })),
        result.text.then(() => "ok").catch((e) => ({ err: e })),
        new Promise<string>((res) => setTimeout(() => res("ok"), 50)),
      ]);
      void probe;
      return { result, provider: entry.name };
    } catch (err) {
      attempts.push({ name: entry.name, error: err instanceof Error ? err.message : String(err) });
      if (!isRateLimitOrTransient(err)) throw err;
    }
  }
  throw new AllProvidersExhaustedError(attempts);
}

export function getProviderList() {
  return availableProviders().map((p) => ({ name: p.name, free: p.free, local: p.local }));
}

export function pickProvider(name?: string) {
  if (!name) return null;
  return pickByName(name);
}
