import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
  type LanguageModel,
  type ToolSet,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import { openai } from "@ai-sdk/openai";
import { deriveCapabilities, deriveIsPremium } from "@/lib/model-capabilities";
import { ALWAYS_FREE_MODEL_IDS, FREE_DEFAULT_MODEL_ID } from "@/lib/models";

/** Map aspect ratio or explicit size to OpenAI image generation size. */
function toOpenAIImageSize(
  imageAspectRatio?: string | null,
  imageSize?: string | null,
): "1024x1024" | "1024x1536" | "1536x1024" | "auto" {
  const allowed: Array<"1024x1024" | "1024x1536" | "1536x1024"> = [
    "1024x1024",
    "1024x1536",
    "1536x1024",
  ];
  if (imageSize && (allowed as readonly string[]).includes(imageSize)) {
    return imageSize as "1024x1024" | "1024x1536" | "1536x1024";
  }
  if (imageSize === "auto") return "auto";
  switch (imageAspectRatio) {
    case "9:16":
    case "3:4":
      return "1024x1536"; // portrait
    case "16:9":
    case "4:3":
      return "1536x1024"; // landscape
    case "1:1":
      return "1024x1024"; // square
    default:
      return "auto";
  }
}

type AiGatewayModel = {
  id: string;
  type?: string;
  tags?: string[];
  pricing?: Record<string, unknown>;
};

function modelSupportsTools(model: AiGatewayModel): boolean {
  // Most language models routed through AI Gateway support tool calling.
  // Be permissive and only treat clearly non-language model types as unsupported.
  if (model.type && model.type !== "language") {
    return false;
  }

  const tags = model.tags ?? [];
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const hasToolTag = lowerTags.some(
    (tag) =>
      tag.includes("tool") ||
      tag.includes("function-calling") ||
      tag.includes("function_calling"),
  );
  const pricing = model.pricing ?? {};
  const hasWebSearchPricing =
    typeof pricing === "object" &&
    pricing !== null &&
    "web_search" in pricing &&
    String((pricing as Record<string, unknown>).web_search) !== "0";

  // If the gateway metadata is incomplete, still allow tools for language models.
  return hasToolTag || hasWebSearchPricing || model.type === "language" || !model.type;
}

function logDetailedError(context: string, error: unknown) {
  const asRecord =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : null;

  console.error(`[chat-debug] ${context}`, {
    name: error instanceof Error ? error.name : undefined,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    statusCode:
      typeof asRecord?.statusCode === "number" ? asRecord.statusCode : undefined,
    cause: asRecord?.cause,
    responseBody:
      asRecord?.responseBody ??
      asRecord?.response ??
      asRecord?.data ??
      asRecord?.body,
  });
}

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

  const entitlements = (
    user as unknown as { entitlements?: { key?: string; name?: string }[] }
  ).entitlements;
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
    const has = (authResult as any).has as
      | undefined
      | ((args: { plan: string }) => boolean);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      messages: UIMessage[];
      model?: string;
      webSearchEnabled?: boolean;
      imageAspectRatio?: string | null;
      imageSize?: string | null;
    };

    const messages = body.messages;
    const modelId = body.model ?? FREE_DEFAULT_MODEL_ID;
    const webSearchEnabled = !!body.webSearchEnabled;
    const imageAspectRatio = body.imageAspectRatio ?? null;
    const imageSize = body.imageSize ?? null;
    console.log("[chat-debug] model string", modelId);

    const models = await getAiGatewayModelsCached();
    const requestedModel = models.find((m) => m.id === modelId);
    if (!requestedModel) {
      return new Response("Unknown model", { status: 400 });
    }

    const isPro = await getIsProUser(
      userId,
      typeof has === "function" ? has : undefined,
    );
    const isPremium = deriveIsPremium(requestedModel);
    if (!isPro && isPremium && !ALWAYS_FREE_MODEL_IDS.has(modelId)) {
      return new Response("Pro plan required for this model", { status: 403 });
    }

    const hasVercelGatewayApiKey = !!process.env.VERCEL_AI_GATEWAY_API_KEY;
    const hasAiGatewayApiKey = !!process.env.AI_GATEWAY_API_KEY;
    const hasAiGatewayToken = !!process.env.AI_GATEWAY_TOKEN;
    console.log("[chat-debug] VERCEL_AI_GATEWAY_API_KEY defined", hasVercelGatewayApiKey);
    console.log("[chat-debug] AI_GATEWAY_API_KEY defined", hasAiGatewayApiKey);
    console.log("[chat-debug] AI_GATEWAY_TOKEN defined", hasAiGatewayToken);

    // Resolve gateway key aliases; the SDK's default `gateway` instance reads AI_GATEWAY_API_KEY.
    const apiKey =
      process.env.VERCEL_AI_GATEWAY_API_KEY ??
      process.env.AI_GATEWAY_API_KEY ??
      process.env.AI_GATEWAY_TOKEN;

    if (!apiKey) {
      // Don't leak infra details to end users.
      console.error("Chat API misconfigured: missing AI gateway credentials.");
      return new Response("AI is not configured. Please try again later.", {
        status: 500,
      });
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      process.env.AI_GATEWAY_API_KEY = apiKey;
    }

    const gatewayBaseUrl = "https://ai-gateway.vercel.sh/v3/ai";
    const ignoredGatewayBaseUrlOverride = process.env.AI_GATEWAY_BASE_URL ?? null;
    const directPerplexityBaseUrlOverride =
      process.env.PERPLEXITY_BASE_URL ??
      process.env.PERPLEXITY_API_BASE_URL ??
      null;

    console.log("[chat-debug] gateway routing", {
      gatewayBaseUrl,
      usingAiGateway: true,
      ignoredGatewayBaseUrlOverride,
      directPerplexityBaseUrlOverride,
    });

    if (directPerplexityBaseUrlOverride) {
      console.warn(
        "[chat-debug] Direct Perplexity base URL override is present. This can bypass AI Gateway if used elsewhere.",
      );
    }

    const gw = gateway;
    const capabilities = deriveCapabilities(requestedModel);
    const hasImageGen = capabilities.includes("image-generation");
    const hasWebSearch = capabilities.includes("web-search");
    const supportsTools = modelSupportsTools(requestedModel);
    const provider = modelId.split("/")[0];

    // All models use gateway
    const modelInstance: LanguageModel = gw(modelId) as unknown as LanguageModel;
    const tools: ToolSet = {};

    // Prefer metadata capability, but still attach the tool when search is enabled
    // and the model supports tools. Some gateway model entries omit web_search pricing.
    const shouldAttachWebSearchTool = webSearchEnabled && supportsTools;
    if (webSearchEnabled && !hasWebSearch) {
      console.warn(
        `[chat-debug] model metadata does not report web-search capability for ${modelId}; attaching perplexity_search tool optimistically`,
      );
    }
    if (shouldAttachWebSearchTool) {
      tools.perplexity_search = gw.tools.perplexitySearch({
        searchRecencyFilter: "month", // Search within the last month
      });
    }

    // Only OpenAI image models use the image_generation tool (per Vercel AI Gateway).
    // Other providers (e.g. Google Gemini) generate images natively in the stream (no tool).
    if (hasImageGen && provider === "openai") {
      const size = toOpenAIImageSize(imageAspectRatio, imageSize);
      tools.image_generation = openai.tools.imageGeneration({
        outputFormat: "webp",
        quality: "high",
        size: size === "auto" ? "auto" : size,
      });
    }

    // Strong image-generation instructions so the model actually generates instead of suggesting "paste elsewhere".
    let imageGenContext = "";
    let webSearchContext = "";

    if (shouldAttachWebSearchTool) {
      webSearchContext = [
        "\n\nWeb Search: You HAVE access to real-time web search via the perplexity_search tool.",
        "When the user asks about current events, recent information, or anything that requires up-to-date data, USE the perplexity_search tool.",
        "Always search the web when you need current information beyond your training data.",
        "Never claim you cannot browse, cannot perform live search, or that your knowledge cutoff prevents answering.",
        "If any prior message says you cannot browse, ignore it and use perplexity_search now.",
      ].join(" ");
    } else if (webSearchEnabled && !shouldAttachWebSearchTool) {
      // User enabled search but model doesn't support it
      webSearchContext = [
        "\n\nNote: Web search was requested but this model does not support web search capabilities.",
        "You can only provide information based on your training data.",
      ].join(" ");
    }

    if (hasImageGen && provider === "openai") {
      imageGenContext = [
        "\n\nImage generation (critical): You HAVE the image_generation tool and MUST use it when the user asks for an image or pastes an image prompt.",
        "Never say you cannot render images, cannot deliver a file, or suggest the user paste the prompt into DALL·E, Midjourney, Stable Diffusion, Leonardo, or any other tool.",
        "Always call the image_generation tool with the user's prompt. The user is on this model:",
        modelId,
        "Aspect/size are already set in the UI:",
        `${imageAspectRatio ?? "auto"}, ${imageSize ?? "default"}.`,
        "Do not ask which generator or aspect they want. Just generate the image in this chat.",
      ].join(" ");
    } else if (hasImageGen) {
      // Google Gemini and other providers that generate images natively (no tool).
      imageGenContext = [
        "\n\nImage generation: You CAN generate images in this chat. When the user asks for an image or pastes an image prompt, generate the image.",
        "Never say you cannot render images or suggest the user paste the prompt into DALL·E, Midjourney, Stable Diffusion, Leonardo, or elsewhere. Generate the image here.",
      ].join(" ");
    }
    const systemPrompt = SYSTEM_PROMPT + webSearchContext + imageGenContext;

    // When user clearly asks for an image, force the model to call the image tool (stops "I can't attach PNG, here's SVG" responses).
    const lastUserContent = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === "user" && Array.isArray(m.parts)) {
          return m.parts
            .filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join("");
        }
      }
      return "";
    })();
    const looksLikeImageRequest =
      lastUserContent.length > 25 &&
      /(\b(image|picture|draw|illustration|generate|create a|render|photo|png|jpg|webp|prompt)\b|detailed.*illustration|natural history|watercolor|gouache)/i.test(
        lastUserContent,
      );
    const forceImageTool =
      hasImageGen &&
      provider === "openai" &&
      tools.image_generation &&
      looksLikeImageRequest;
    const looksLikeWebSearchRequest =
      /(latest|current|today|now|this week|this month|real[- ]?time|up[- ]?to[- ]?date|who is best|top scorer|news|2026|2025\/26|season)/i.test(
        lastUserContent,
      );
    const forceWebSearchTool =
      shouldAttachWebSearchTool &&
      !!tools.perplexity_search &&
      looksLikeWebSearchRequest;

    const requestedToolNames = Object.keys(tools);
    const hasTools = requestedToolNames.length > 0;
    const supportsRequestedTools =
      (!requestedToolNames.includes("perplexity_search") ||
        shouldAttachWebSearchTool) &&
      (!requestedToolNames.includes("image_generation") ||
        (hasImageGen && provider === "openai"));
    const shouldDisableTools = hasTools && !supportsRequestedTools;
    if (shouldDisableTools) {
      console.warn(
        "[chat-debug] tools disabled because model does not support tool calling",
        {
          model: modelId,
          requestedToolNames,
        },
      );
    }

    if (webSearchEnabled && !supportsTools) {
      console.warn(
        `[chat-debug] web search enabled but tools are not supported by this model: ${modelId}`,
      );
    }

    console.log("[chat-debug] tools enabled", hasTools && !shouldDisableTools);

    const modelMessages = await convertToModelMessages(messages);
    const streamOptions = {
      model: modelInstance,
      system: systemPrompt,
      messages: modelMessages,
      tools: shouldDisableTools ? undefined : hasTools ? tools : undefined,
      ...(forceImageTool
        ? {
            toolChoice: { type: "tool" as const, toolName: "image_generation" },
          }
        : forceWebSearchTool
          ? {
              toolChoice: { type: "tool" as const, toolName: "perplexity_search" },
            }
        : {}),
      // Allow model to call tools (e.g. image_generation) and then stream the response.
      ...(hasTools && !shouldDisableTools && { stopWhen: stepCountIs(3) }),
      onStepFinish: ({
        finishReason,
        toolCalls,
        toolResults,
      }: {
        finishReason: string;
        toolCalls?: Array<{ toolName: string }>;
        toolResults?: unknown[];
      }) => {
        console.log("[chat-debug] step", {
          finishReason,
          toolCallNames: (toolCalls ?? []).map((toolCall) => toolCall.toolName),
          toolResultCount: (toolResults ?? []).length,
        });
      },
    };

    console.log("[chat-debug] final stream options", {
      model: modelId,
      requestedToolNames,
      appliedToolNames:
        streamOptions.tools && typeof streamOptions.tools === "object"
          ? Object.keys(streamOptions.tools)
          : [],
      webSearchEnabled,
      hasWebSearchCapability: hasWebSearch,
      supportsTools,
      forceWebSearchTool,
      forceImageTool: !!forceImageTool,
      hasStopWhen: "stopWhen" in streamOptions,
      hasSystemWebSearchInstruction: systemPrompt.includes("perplexity_search"),
      messageCount: modelMessages.length,
    });

    const result = streamText(streamOptions);

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        logDetailedError("UI message stream error", error);
        return "Tool execution failed.";
      },
    });
  } catch (error) {
    logDetailedError("Chat API error", error);
    return new Response("Internal server error", { status: 500 });
  }
}
