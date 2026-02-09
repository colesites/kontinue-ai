export interface ModelOption {
  id: string; // Format: "provider/model" for Vercel AI Gateway
  name: string;
  provider:
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "minimax"
  | "mistral"
  | "perplexity"
  | "zai"
  | "alibaba";
  description: string;
  isDefault?: boolean;
}

import { OPENAI_MODELS } from "@/lib/openai";
import { ANTHROPIC_MODELS } from "@/lib/anthropic";
import { GOOGLE_MODELS } from "@/lib/google";
import { DEEPSEEK_MODELS } from "@/lib/deepseek";
import { MINIMAX_MODELS } from "@/lib/minimax";
import { MISTRAL_MODELS } from "@/lib/mistral";
import { PERPLEXITY_MODELS } from "@/lib/perplexity";
import { ZAI_MODELS } from "@/lib/zai";
import { ALIBABA_MODELS } from "@/lib/alibaba";

// Using Vercel AI Gateway format: "provider/model"
// All accessible with a single AI_GATEWAY_API_KEY (or AI_GATEWAY_TOKEN) via AI Gateway
export const AVAILABLE_MODELS: ModelOption[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...DEEPSEEK_MODELS,
  ...MINIMAX_MODELS,
  ...MISTRAL_MODELS,
  ...PERPLEXITY_MODELS,
  ...ZAI_MODELS,
  ...ALIBABA_MODELS,
];

export function getModelById(id: string): ModelOption | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getDefaultModel(): ModelOption {
  return AVAILABLE_MODELS.find((m) => m.isDefault) || AVAILABLE_MODELS[0];
}

export function getProviderColor(provider: ModelOption["provider"]): string {
  const colors = {
    openai: "#10a37f",
    anthropic: "#cc785c",
    google: "#4285f4",
    deepseek: "#3b82f6",
    minimax: "#a855f7",
    mistral: "#ffffff",
    perplexity: "#20b8cd",
    zai: "#f97316",
    alibaba: "#ef4444",
  };
  return colors[provider];
}
