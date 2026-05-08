import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getCerebrasModel(): LanguageModelV1 | null {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return null;
  const model = process.env.CEREBRAS_MODEL ?? "llama-3.3-70b";
  const provider = createOpenAICompatible({
    name: "cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    apiKey: key,
  });
  return provider(model);
}

export const CEREBRAS_NAME = "cerebras";
