import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";

export function getOpenAIModel(): LanguageModelV1 | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const provider = createOpenAI({ apiKey: key, compatibility: "strict" });
  return provider(model);
}

export const OPENAI_NAME = "openai";
