# Web Search Implementation

## Overview

This document describes the web search implementation for the Continue AI chat application. All models with web search capability use **Perplexity's provider-agnostic search tool** via Vercel AI Gateway.

## Implementation Approach

### Unified Search Strategy

Instead of using provider-specific native search tools (like `openai.tools.webSearch()` or `google.tools.googleSearch()`), we use a single unified approach:

- **All models** with web search capability use `gateway.tools.perplexitySearch()`
- Only requires `AI_GATEWAY_TOKEN` (no separate API keys needed)
- Consistent search behavior across all providers
- Works with OpenAI, Google, Anthropic, and any other model via AI Gateway

### Why Perplexity Search?

**Advantages:**
- Single API key for all models (`AI_GATEWAY_TOKEN`)
- Consistent search behavior across different providers
- No need for separate Google API key or OpenAI API key
- Works with models that don't have native search capabilities
- Provider-agnostic implementation

**Cost:**
- $5 per 1,000 search requests (no markup from Vercel)

## Supported Models

### Models with Web Search Capability

According to [Vercel AI Gateway](https://vercel.com/ai-gateway/models?capabilities=web-search), the following models support web search:

**OpenAI:**
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `openai/gpt-5-mini`

**Google Gemini:**
- `google/gemini-2.0-flash-exp`
- `google/gemini-1.5-pro`
- `google/gemini-1.5-flash`

**Anthropic:**
- `anthropic/claude-opus-4-20250514` (Claude Opus 4.6)

**Perplexity Sonar:**
- `perplexity/sonar`
- `perplexity/sonar-pro`
- `perplexity/sonar-reasoning-pro`

Note: Perplexity Sonar models have built-in search capabilities and don't need the `perplexity_search` tool.

## Code Implementation

### Chat API Route (`src/app/api/chat/route.ts`)

```typescript
import { createGateway } from "@ai-sdk/gateway";

// Create gateway with AI_GATEWAY_TOKEN
const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_TOKEN;
const gw = createGateway({ apiKey });

// Get model capabilities
const capabilities = deriveCapabilities(requestedModel);
const hasWebSearch = capabilities.includes("web-search");

// Use gateway for all models
const modelInstance: LanguageModel = gw(modelId) as unknown as LanguageModel;
const tools: Record<string, unknown> = {};

// Add Perplexity search for models with web search capability
if (webSearchEnabled && hasWebSearch) {
  tools.perplexity_search = gw.tools.perplexitySearch({
    searchRecencyFilter: "month", // Search within the last month
  });
}
```

### System Prompt

When web search is enabled, the system prompt includes:

```
Web Search: You HAVE access to real-time web search via the perplexity_search tool.
When the user asks about current events, recent information, or anything that requires 
up-to-date data, USE the perplexity_search tool. Always search the web when you need 
current information beyond your training data.
```

## Configuration Options

The `perplexitySearch()` tool supports several configuration options:

### Recency Filter
```typescript
gateway.tools.perplexitySearch({
  searchRecencyFilter: "month" // Options: "hour", "day", "week", "month"
})
```

### Domain Filter
```typescript
gateway.tools.perplexitySearch({
  searchDomainFilter: ["vercel.com", "github.com"] // Limit search to specific domains
})
```

### Combined Filters
```typescript
gateway.tools.perplexitySearch({
  searchRecencyFilter: "week",
  searchDomainFilter: ["docs.vercel.com"]
})
```

## Capability Detection

The `deriveCapabilities()` function in `src/lib/model-capabilities.ts` checks the AI Gateway pricing metadata to determine if a model supports web search:

```typescript
export function deriveCapabilities(model: AiGatewayModel): string[] {
  const capabilities: string[] = [];
  const pricing = model.pricing as Record<string, unknown> | undefined;
  
  if (pricing?.web_search) {
    capabilities.push("web-search");
  }
  
  // ... other capabilities
  
  return capabilities;
}
```

## Environment Variables

Required environment variable:
- `AI_GATEWAY_TOKEN` or `AI_GATEWAY_API_KEY` - Vercel AI Gateway token

No additional API keys needed for web search!

## Testing

Tests are located in `src/__tests__/webSearch.test.ts` and verify:

1. Perplexity search tool is available via AI Gateway
2. Correct models are identified as having web search capability
3. Unified search implementation is properly configured
4. Search filters can be configured correctly

Run tests with:
```bash
bun test src/__tests__/webSearch.test.ts
```

## References

- [Vercel AI SDK Web Search Documentation](https://sdk.vercel.ai/cookbook/node/web-search-agent)
- [Perplexity Search with AI Gateway Blog Post](https://vercel.com/blog/use-perplexity-web-search-with-vercel-ai-gateway)
- [Vercel AI Gateway Models with Web Search](https://vercel.com/ai-gateway/models?capabilities=web-search)
- [Perplexity Pricing](https://docs.perplexity.ai/guides/pricing)

## Migration Notes

### Previous Implementation

The previous implementation used provider-specific native search tools:
- OpenAI models: `openai.tools.webSearch()` via AI Gateway
- Google models: `googleProvider.tools.googleSearch()` via direct Google API with `GOOGLE_API_KEY`

### Current Implementation

Now all models use the unified Perplexity search approach:
- All models: `gateway.tools.perplexitySearch()` via AI Gateway with `AI_GATEWAY_TOKEN`

This simplifies the implementation and removes the need for separate API keys.
