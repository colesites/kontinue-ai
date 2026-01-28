"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";

/**
 * Parse markdown content from ChatGPT/Claude/Gemini shared pages
 * to extract conversation messages.
 * 
 * ChatGPT format uses:
 * ##### You said:
 * [user message content]
 * 
 * ###### ChatGPT said:
 * [assistant message content]
 */
function parseConversationFromMarkdown(markdown: string): {
  title: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  let title: string | null = null;

  // Find the first "You said:" to strip header boilerplate
  const firstUserIndex = markdown.search(/#{1,6}\s*You said:/i);
  if (firstUserIndex === -1) {
    // No conversation found
    return { title, messages };
  }

  // Find the last occurrence of common footer patterns to strip footer boilerplate
  const footerPatterns = [
    /ChatGPT can make mistakes/i,
    /Check important info/i,
    /Report conversation/i,
    // ChatGPT UI elements that appear at the end
    /^Attach$/m,
    /^Search$/m,
    /^Study$/m,
    /^Create image$/m,
    /^Voice$/m,
  ];
  
  let conversationEnd = markdown.length;
  for (const pattern of footerPatterns) {
    const match = markdown.search(pattern);
    if (match !== -1 && match > firstUserIndex) {
      // Find the start of the line containing this pattern
      const lineStart = markdown.lastIndexOf('\n', match);
      if (lineStart !== -1 && lineStart < conversationEnd) {
        conversationEnd = lineStart;
      }
    }
  }

  // Extract just the conversation portion
  const conversationText = markdown.slice(firstUserIndex, conversationEnd);

  // Split by message markers
  // ChatGPT uses: ##### You said: and ###### ChatGPT said:
  // The pattern matches header markers followed by role indicators
  const messagePattern = /#{1,6}\s*(You said|ChatGPT said|Claude said|Gemini said|Assistant|User|Human):/gi;
  
  const parts = conversationText.split(messagePattern);
  
  // parts[0] is empty or content before first marker
  // parts[1] is the role (You said, ChatGPT said, etc.)
  // parts[2] is the content
  // parts[3] is the next role, etc.
  
  for (let i = 1; i < parts.length; i += 2) {
    const roleMarker = parts[i]?.toLowerCase().trim();
    const content = parts[i + 1]?.trim();
    
    if (!roleMarker || !content) continue;
    
    let role: "user" | "assistant";
    if (roleMarker.includes("you") || roleMarker === "user" || roleMarker === "human") {
      role = "user";
    } else {
      role = "assistant";
    }
    
    // Clean up the content
    let cleanContent = content;
    
    // Remove "Sources" section at the end of assistant messages
    const sourcesIndex = cleanContent.search(/^Sources$/im);
    if (sourcesIndex !== -1 && role === "assistant") {
      cleanContent = cleanContent.slice(0, sourcesIndex).trim();
    }
    
    // Clean up ChatGPT code block artifacts
    // ChatGPT adds language identifier and "Copy code" as text inside code blocks
    // Pattern: ```lang\nlang\nCopy code\n...actual code...```
    cleanContent = cleanContent.replace(
      /```(\w+)\n\1\nCopy code\n/gi,
      "```$1\n"
    );
    // Also handle case where it's just "lang\nCopy code" at start of code block
    cleanContent = cleanContent.replace(
      /```(\w+)\n\1 Copy code\n/gi,
      "```$1\n"
    );
    // Handle standalone "Copy code" lines
    cleanContent = cleanContent.replace(/^Copy code\n/gm, "");
    
    if (cleanContent) {
      messages.push({ role, content: cleanContent });
    }
  }

  // Try to extract title from first user message or page title
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch && !titleMatch[1].toLowerCase().includes("you said")) {
    title = titleMatch[1].trim();
  } else if (messages.length > 0 && messages[0].role === "user") {
    // Use first user message as title (truncated)
    const firstMessage = messages[0].content;
    title = firstMessage.length > 60 ? firstMessage.slice(0, 60) + "..." : firstMessage;
  }

  return { title, messages };
}

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
      throw new Error("FIRECRAWL_API_KEY is not set in Convex environment variables");
    }

    const requestBody = {
      url: args.url,
      formats: ["markdown"],
      onlyMainContent: false, // Get everything including dynamically loaded content
      waitFor: 5000, // Wait 5 seconds for JS to load chat content
      mobile: false,
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
        if (errorBody) {
          errorMessage = errorBody;
        }
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

    // Parse the markdown to extract messages
    const parsed = parseConversationFromMarkdown(markdown);

    return {
      markdown,
      title: parsed.title,
      messages: parsed.messages,
      metadata: result.data?.metadata || null,
    };
  },
});
