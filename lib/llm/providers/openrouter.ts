import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getOpenRouterModel(): LanguageModelV1 | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const model = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";
  const provider = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    headers: {
      "HTTP-Referer": "https://github.com/praxon-dev/praxon",
      "X-Title": "Praxon",
    },
  });
  return provider(model);
}

export const OPENROUTER_NAME = "openrouter";
