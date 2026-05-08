import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getOllamaModel(): LanguageModelV1 | null {
  const baseURL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
  const enabled = process.env.OLLAMA_ENABLED === "1" || !!process.env.OLLAMA_MODEL;
  if (!enabled) return null;
  const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
  const provider = createOpenAICompatible({
    name: "ollama",
    baseURL,
    apiKey: "ollama",
  });
  return provider(model);
}

export const OLLAMA_NAME = "ollama";
