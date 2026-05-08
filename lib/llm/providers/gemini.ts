import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV1 } from "ai";

export function getGeminiModel(): LanguageModelV1 | null {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-exp";
  const provider = createGoogleGenerativeAI({ apiKey: key });
  return provider(model);
}

export const GEMINI_NAME = "gemini";
