import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

export function getNvidiaNimModel(): LanguageModelV1 | null {
  const key = process.env.NVIDIA_NIM_API_KEY;
  if (!key) return null;
  const model = process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.3-70b-instruct";
  const provider = createOpenAICompatible({
    name: "nvidia-nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: key,
  });
  return provider(model);
}

export const NVIDIA_NIM_NAME = "nvidia-nim";
