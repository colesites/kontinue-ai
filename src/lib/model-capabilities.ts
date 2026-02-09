export type ModelCapability =
  | "text"
  | "image-generation"
  | "implicit-caching"
  | "explicit-caching"
  | "web-search"
  | "thinking"
  | "embedding";

type AiGatewayModel = {
  id: string;
  type?: "language" | "embedding" | "image" | string;
  tags?: string[];
  pricing?: Record<string, unknown>;
};

export function deriveIsPremium(model: AiGatewayModel): boolean {
  const caps = deriveCapabilities(model);
  return (
    caps.includes("image-generation") ||
    caps.includes("thinking") ||
    caps.includes("web-search") ||
    caps.includes("explicit-caching")
  );
}

export function deriveCapabilities(model: AiGatewayModel): ModelCapability[] {
  const caps = new Set<ModelCapability>();

  if (model.type === "language") caps.add("text");
  if (model.type === "embedding") caps.add("embedding");

  if (Array.isArray(model.tags)) {
    for (const tag of model.tags) {
      if (tag === "image-generation") caps.add("image-generation");
      if (tag === "implicit-caching") caps.add("implicit-caching");
      if (tag === "reasoning") caps.add("thinking");
    }
  }

  const pricing = model.pricing ?? {};
  if (pricing && typeof pricing === "object") {
    if ("input_cache_write" in pricing) caps.add("explicit-caching");
    if ("input_cache_read" in pricing) {
      // This doesn't necessarily imply implicit caching, but it indicates cache reads are supported.
      // We'll still use the dedicated tag for implicit caching.
    }
    const webSearch = (pricing as Record<string, unknown>).web_search;
    if (webSearch !== undefined && webSearch !== null && String(webSearch) !== "0") {
      caps.add("web-search");
    }
    if ("image" in pricing || "image_output" in pricing) {
      caps.add("image-generation");
    }
  }

  return Array.from(caps);
}

export async function fetchAiGatewayModels(): Promise<AiGatewayModel[]> {
  const res = await fetch("https://ai-gateway.vercel.sh/v1/models");
  if (!res.ok) {
    throw new Error(`Failed to fetch AI Gateway models: ${res.status}`);
  }
  const json = (await res.json()) as { data?: AiGatewayModel[] };
  return json.data ?? [];
}
