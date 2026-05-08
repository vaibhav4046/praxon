import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getTogetherModel(): LanguageModelV1 | null {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return null;
  const model = process.env.TOGETHER_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
  const provider = createOpenAICompatible({
    name: "together",
    baseURL: "https://api.together.xyz/v1",
    apiKey: key,
  });
  return provider(model);
}

export const TOGETHER_NAME = "together";
