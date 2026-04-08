import { gateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import type { ToolSet } from "ai";
import { deriveCapabilities } from "../../../../lib/model-capabilities";
import type { AiGatewayModel, OpenAIImageSize } from "./types";
import { modelSupportsTools } from "./model-utils";
import { toOpenAIImageSize } from "./request-utils";
import {
  buildResponseBudgetContext,
  buildImageGenerationContext,
  buildWebSearchContext,
  CHAT_SYSTEM_PROMPT,
  isLikelyImageRequest,
  isLikelyWebSearchRequest,
  looksLikeSportsPlayerQuery,
} from "./prompt";

export type ToolsConfigResult = {
  tools: ToolSet;
  hasImageGen: boolean;
  hasWebSearch: boolean;
  supportsTools: boolean;
  provider: string;
  shouldAttachWebSearchTool: boolean;
  canUseOpenAIImageTool: boolean;
  openaiImageToolSize: OpenAIImageSize | null;
  systemPrompt: string;
  forceImageTool: boolean;
  forceWebSearchTool: boolean;
};

export function buildToolsAndPrompt(options: {
  requestedModel: AiGatewayModel;
  modelId: string;
  webSearchEnabled: boolean;
  lastUserContent: string;
  maxOutputTokens: number;
  imageAspectRatio?: string | null;
  imageSize?: string | null;
  apiKey: string;
  gatewayOpenAIBaseUrl: string;
}): ToolsConfigResult {
  const {
    requestedModel,
    modelId,
    webSearchEnabled,
    lastUserContent,
    maxOutputTokens,
    imageAspectRatio,
    imageSize,
    apiKey,
    gatewayOpenAIBaseUrl,
  } = options;

  const capabilities = deriveCapabilities(requestedModel);
  const hasImageGen = capabilities.includes("image-generation");
  const hasWebSearch = capabilities.includes("web-search");
  const supportsTools = modelSupportsTools(requestedModel);
  const provider = modelId.split("/")[0];

  const tools: ToolSet = {};
  const shouldAttachWebSearchTool = webSearchEnabled && supportsTools;
  const sportsPlayerQuery = looksLikeSportsPlayerQuery(lastUserContent);

  if (webSearchEnabled && !hasWebSearch) {
    console.warn(
      `[chat-debug] model metadata does not report web-search capability for ${modelId}; attaching perplexity_search tool optimistically`,
    );
  }

  if (shouldAttachWebSearchTool) {
    tools.perplexity_search = gateway.tools.perplexitySearch({
      searchRecencyFilter: sportsPlayerQuery ? "year" : "month",
      maxResults: 5,
      maxTokensPerPage: 512,
      maxTokens: 4000,
      ...(sportsPlayerQuery
        ? {
            searchDomainFilter: [
              "espn.com",
              "fbref.com",
              "whoscored.com",
              "sofascore.com",
              "premierleague.com",
              "chelseafc.com",
            ],
          }
        : {}),
    });
  }

  const canUseOpenAIImageTool = hasImageGen && provider === "openai";
  let openaiImageToolSize: OpenAIImageSize | null = null;
  if (canUseOpenAIImageTool) {
    const size = toOpenAIImageSize(imageAspectRatio, imageSize);
    openaiImageToolSize = size;
    const openaiViaGateway = createOpenAI({
      apiKey,
      baseURL: gatewayOpenAIBaseUrl,
    });
    tools.image_generation = openaiViaGateway.tools.imageGeneration({
      outputFormat: "webp",
      quality: "high",
      size: size === "auto" ? "auto" : size,
    });
  }

  const webSearchContext = buildWebSearchContext({
    webSearchEnabled,
    shouldAttachWebSearchTool,
  });
  const responseBudgetContext = buildResponseBudgetContext({ maxOutputTokens });
  const imageGenContext = buildImageGenerationContext({
    canUseOpenAIImageTool,
    hasImageGen,
    modelId,
    imageAspectRatio,
    imageSize,
  });
  const systemPrompt =
    CHAT_SYSTEM_PROMPT +
    responseBudgetContext +
    webSearchContext +
    imageGenContext;

  const forceImageTool =
    hasImageGen &&
    provider === "openai" &&
    !!tools.image_generation &&
    isLikelyImageRequest(lastUserContent);
  const forceWebSearchTool =
    shouldAttachWebSearchTool &&
    !!tools.perplexity_search &&
    isLikelyWebSearchRequest(lastUserContent);

  return {
    tools,
    hasImageGen,
    hasWebSearch,
    supportsTools,
    provider,
    shouldAttachWebSearchTool,
    canUseOpenAIImageTool,
    openaiImageToolSize,
    systemPrompt,
    forceImageTool,
    forceWebSearchTool,
  };
}
