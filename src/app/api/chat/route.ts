import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  type LanguageModel,
} from "ai";
import { createGateway, gateway } from "@ai-sdk/gateway";

type AiGatewayModel = {
  id: string;
  type?: string;
  tags?: string[];
  pricing?: Record<string, unknown>;
};

let cachedModels: AiGatewayModel[] | null = null;
let cachedModelsAtMs = 0;

async function getAiGatewayModelsCached(): Promise<AiGatewayModel[]> {
  const now = Date.now();
  if (cachedModels && now - cachedModelsAtMs < 5 * 60_000) {
    return cachedModels;
  }

  const res = await fetch("https://ai-gateway.vercel.sh/v1/models");
  if (!res.ok) {
    throw new Error(`Failed to fetch AI Gateway models: ${res.status}`);
  }

  const json = (await res.json()) as { data?: AiGatewayModel[] };
  cachedModels = json.data ?? [];
  cachedModelsAtMs = now;
  return cachedModels;
}

function isPremiumModel(model: AiGatewayModel): boolean {
  const tags = model.tags ?? [];
  const pricing = model.pricing ?? {};

  const hasImageGen = tags.includes("image-generation") ||
    (pricing && typeof pricing === "object" && ("image" in pricing || "image_output" in pricing));
  const hasThinking = tags.includes("reasoning");
  const hasWebSearch =
    pricing &&
    typeof pricing === "object" &&
    "web_search" in pricing &&
    pricing.web_search !== null &&
    String(pricing.web_search) !== "0";
  const hasExplicitCaching =
    pricing && typeof pricing === "object" && "input_cache_write" in pricing;

  return hasImageGen || hasThinking || hasWebSearch || hasExplicitCaching;
}

async function getIsProUser(clerkUserId: string): Promise<boolean> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  const publicMetadata = (user.publicMetadata ?? {}) as {
    plan?: string;
    subscriptionStatus?: string;
  };

  const planFromMetadata = publicMetadata.plan;
  const subscriptionStatusFromMetadata = publicMetadata.subscriptionStatus;

  const isProFromLegacy =
    planFromMetadata === "pro" || subscriptionStatusFromMetadata === "active";

  const entitlements = (user as unknown as { entitlements?: { key?: string; name?: string }[] })
    .entitlements;
  const isProFromEntitlements = (entitlements ?? []).some(
    (e) => e.key === "pro" || e.name === "Pro",
  );

  return isProFromLegacy || isProFromEntitlements;
}

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Continue AI, an advanced AI assistant. 

The user has imported a conversation from another AI platform and wants to continue it with you. You have access to the full conversation history.

Guidelines:
- Continue naturally from where the previous conversation left off
- Maintain context from the imported messages
- Be helpful, accurate, and thoughtful
- If the conversation was about a specific task, help complete it
- If there were any issues or hallucinations in the previous conversation, help correct them
- Acknowledge the context when appropriate but don't repeatedly mention that you're continuing from another AI

Formatting:
- Use markdown formatting in your responses for better readability
- Use **bold** for emphasis and important terms
- Use \`code\` for inline code and \`\`\`language for code blocks
- Use bullet points and numbered lists when appropriate
- Use headers (##, ###) to organize longer responses
- Use tables when presenting structured data`;

export async function POST(req: Request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, model: modelId = "openai/gpt-4o" }: { messages: UIMessage[]; model?: string } = await req.json();

    const models = await getAiGatewayModelsCached();
    const requestedModel = models.find((m) => m.id === modelId);
    if (!requestedModel) {
      return new Response("Unknown model", { status: 400 });
    }

    const isPro = await getIsProUser(userId);
    if (!isPro && isPremiumModel(requestedModel)) {
      return new Response("Pro plan required for this model", { status: 403 });
    }

    // Use Vercel AI Gateway - single key for all models.
    // Gateway expects AI_GATEWAY_API_KEY; we also support AI_GATEWAY_TOKEN for convenience.
    const apiKey =
      process.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_TOKEN;

    const gw = apiKey ? createGateway({ apiKey }) : null;

    // Format: "provider/model" e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet", "google/gemini-2.0-flash"
    const result = streamText({
      model: (gw ? gw(modelId) : gateway(modelId)) as unknown as LanguageModel,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
