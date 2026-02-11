"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";

const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";

// ============================================================================
// SYSTEM PROMPT FOR CHAT NORMALIZATION
// ============================================================================

const NORMALIZER_SYSTEM_PROMPT = `You are a strict chat transcript normalizer.
Your goal is to extract ONLY the conversation between the User and the AI from a raw web scrape.

INPUT: Raw markdown that may contain:
- Headers (e.g., "Chat with Gemini", "Claude - My Chat")
- Footers (copyright, terms, links)
- UI Chrome (buttons like "Copy", "Regenerate", "Share", "Sign in")
- Metadata (timestamps, model names)

OUTPUT: A strict sequence of messages in this EXACT format:

[USER]:
<user message content>

[ASSISTANT]:
<ai response content>

RULES:
1.  **REMOVE ALL HEADERS & FOOTERS**: Delete anything that is not part of the actual conversation flow.
2.  **REMOVE UI TEXT**: Delete "Copy code", "Regenerate response", "Share", "bad/good response" buttons text.
3.  **STRICT ROLES**: 
    - The person asking questions is [USER].
    - The AI answering is [ASSISTANT].
    - Look for specific markers like "You said:", "ChatGPT said:", "User:", "Assistant:", "Gemini:", "Perplexity:" to identify who is speaking.
    - If markers are unclear, strictly alternate between [USER] and [ASSISTANT] starting with [USER].
    - [USER] messages usually come first.
    - [ASSISTANT] messages usually follow.
4.  **PRESERVE CONTENT**: 
    - Keep the actual message content (code blocks, markdown tables, bold text) EXACTLY as is. Do not summarize or rewrite.
    - **IMAGES**: strictly PRESERVE all markdown images in the format ![alt](url). Do NOT remove them.
    - **DIAGRAMS/CODE**: strictly PRESERVE all code blocks and diagrams (Mermaid, ASCII), even if they constitute the entire message.
5.  **NO EXTRA TEXT**: Do not add "Here is the transcript" or "Summary:". Just the bracketed labels and content.
6.  **CODE BLOCKS**: If there is code, keep it inside standard \`\`\` blocks. Do NOT put [USER] or [ASSISTANT] tags *inside* a code block. Ensure language tags (like \`\`\`mermaid\` or \`\`\`typescript\`) are preserved.

EXAMPLE INPUT:
"Chat with Claude
User
Hello there
Claude
Hi! How can I help?
Copy
Regenerate"

EXAMPLE OUTPUT:
[USER]:
Hello there

[ASSISTANT]:
Hi! How can I help?
`;

// ============================================================================
// LLM NORMALIZATION (ALL PROVIDERS)
// ============================================================================

function getLLMModel() {
  const apiKey = process.env.AI_GATEWAY_TOKEN;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_TOKEN is not set");
  }
  const gw = createGateway({ apiKey });
  const modelId = "google/gemini-2.0-flash-001";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return gw(modelId) as any;
}

async function normalizeTranscriptWithLLM(markdown: string) {
  const { text } = await generateText({
    model: getLLMModel(),
    system: NORMALIZER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please normalize this transcript:\n\n${markdown}`,
      },
    ],
    // @ts-ignore - explicitly supported by Vercel AI SDK even if types lag
    maxTokens: 8192, // Increase output token limit to prevent truncation (Gemini supports long output)
  });

  return text.trim();
}

// ============================================================================
// LLM TITLE SUMMARIZER (for Gemini/Perplexity - short summary not truncation)
// ============================================================================

async function generateShortTitle(firstMessage: string): Promise<string> {
  const { text } = await generateText({
    model: getLLMModel(),
    system: `You generate very short chat titles (max 6 words). Respond with ONLY the title, no quotes or punctuation at the end.`,
    messages: [
      {
        role: "user",
        content: `Generate a short title for a chat that starts with this message:\n\n${firstMessage.slice(0, 500)}`,
      },
    ],
  });

  return text.trim().slice(0, 50);
}

// ============================================================================
// PARSER
// ============================================================================

export function parseNormalizedTranscript(normalizedText: string): {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Split by [USER]: or [ASSISTANT]: markers
  // The regex captures the delimiter so we can identify the role
  const parts = normalizedText.split(/(?:^|\n)(\[(?:USER|ASSISTANT)\]):\n/g);

  // parts[0] might be empty or pre-text (should be empty if LLM followed rules)
  // parts[1] = marker, parts[2] = content, parts[3] = marker, parts[4] = content...

  for (let i = 1; i < parts.length; i += 2) {
    const roleMarker = parts[i];
    const content = parts[i + 1]?.trim();

    if (!roleMarker || !content) continue;

    const role = roleMarker === "[USER]" ? "user" : "assistant";
    messages.push({ role, content });
  }

  return { messages };
}

// ============================================================================
// MAIN ACTION: SCRAPE URL
// ============================================================================

export const scrapeUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "FIRECRAWL_API_KEY is not set in Convex environment variables",
      );
    }

    const requestBody = {
      url: args.url,
      formats: ["markdown"],
      onlyMainContent: false, // We need the whole page to find the chat container usually, but let's try false to get everything then clean
      waitFor: 3000,
    };

    const response = await fetch(`${FIRECRAWL_API_BASE}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Firecrawl API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Firecrawl scrape failed");
    }

    const markdown = result.data?.markdown || "";
    if (!markdown) {
      throw new Error("No content found on the page");
    }

    // ========================================
    // PROVIDER DETECTION
    // ========================================
    const urlLower = args.url.toLowerCase();
    const isPerplexity = urlLower.includes("perplexity.ai");
    const isGemini =
      urlLower.includes("gemini.google.com") ||
      urlLower.includes("aistudio.google.com");

    // ========================================
    // LLM NORMALIZATION (ALL PROVIDERS)
    // ========================================
    // User requested LLM normalization for all providers (including ChatGPT/T3) due to better quality
    const normalizedText = await normalizeTranscriptWithLLM(markdown);
    const { messages } = parseNormalizedTranscript(normalizedText);

    if (messages.length === 0) {
      throw new Error(
        "Could not extract any messages from the page. The parsing might have failed.",
      );
    }

    // ========================================
    // TITLE GENERATION
    // ========================================
    let finalTitle: string | null = null;

    if (isPerplexity || isGemini) {
      // LLM-generated short summary title
      if (messages.length > 0 && messages[0].role === "user") {
        finalTitle = await generateShortTitle(messages[0].content);
      } else {
        finalTitle = isPerplexity
          ? "Imported Perplexity Chat"
          : "Imported Gemini Chat";
      }
    } else {
      // Use metadata title for ChatGPT/T3Chat/others
      finalTitle = result.data?.metadata?.title || null;
      if (!finalTitle && messages.length > 0 && messages[0].role === "user") {
        const firstLine = messages[0].content.split("\n")[0].trim();
        finalTitle =
          firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;
      }
    }

    return {
      markdown: normalizedText, // Return the clean version for debug
      title: finalTitle,
      messages: messages,
      metadata: result.data?.metadata || null,
    };
  },
});
