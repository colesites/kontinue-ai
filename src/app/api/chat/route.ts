import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  type LanguageModel,
} from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { deriveIsPremium } from "@/lib/model-capabilities";
import { ALWAYS_FREE_MODEL_IDS, FREE_DEFAULT_MODEL_ID } from "@/lib/models";

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

async function getIsProUser(
  clerkUserId: string,
  hasPlan?: (args: { plan: string }) => boolean,
): Promise<boolean> {
  if (typeof hasPlan === "function" && hasPlan({ plan: "pro_plan" })) {
    return true;
  }

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
    const authResult = await auth();
    const userId = authResult.userId;
    // `has` isn't always present in Clerk server typings, so access defensively.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const has = (authResult as any).has as undefined | ((args: { plan: string }) => boolean);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const {
      messages,
      model: modelId = FREE_DEFAULT_MODEL_ID,
    }: { messages: UIMessage[]; model?: string } = await req.json();

    const models = await getAiGatewayModelsCached();
    const requestedModel = models.find((m) => m.id === modelId);
    if (!requestedModel) {
      return new Response("Unknown model", { status: 400 });
    }

    const isPro = await getIsProUser(
      userId,
      typeof has === "function" ? has : undefined
    );
    const isPremium = deriveIsPremium(requestedModel);
    if (!isPro && isPremium && !ALWAYS_FREE_MODEL_IDS.has(modelId)) {
      return new Response("Pro plan required for this model", { status: 403 });
    }

    // Use Vercel AI Gateway - single key for all models.
    // Gateway expects AI_GATEWAY_API_KEY; we also support AI_GATEWAY_TOKEN for convenience.
    const apiKey =
      process.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_TOKEN;

    if (!apiKey) {
      // Don't leak infra details to end users.
      console.error("Chat API misconfigured: missing AI gateway credentials.");
      return new Response("AI is not configured. Please try again later.", {
        status: 500,
      });
    }

    const gw = createGateway({ apiKey });

    // Format: "provider/model" e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet", "google/gemini-2.0-flash"
    const result = streamText({
      model: gw(modelId) as unknown as LanguageModel,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
