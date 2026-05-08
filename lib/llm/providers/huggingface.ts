import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getHuggingFaceModel(): LanguageModelV1 | null {
  const key = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
  if (!key) return null;
  const model = process.env.HF_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct";
  const provider = createOpenAICompatible({
    name: "huggingface",
    baseURL: "https://api-inference.huggingface.co/v1",
    apiKey: key,
  });
  return provider(model);
}

export const HF_NAME = "huggingface";
