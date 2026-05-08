import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "ai";

export function getAnthropicModel(): LanguageModelV1 | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
  const provider = createAnthropic({ apiKey: key });
  return provider(model) as unknown as LanguageModelV1;
}

export const ANTHROPIC_NAME = "anthropic";
