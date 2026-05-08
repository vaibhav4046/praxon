import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getGroqModel(): LanguageModelV1 | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  const provider = createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: key,
  });
  return provider(model);
}

export const GROQ_NAME = "groq";
