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
      const lineStart = markdown.lastIndexOf("\n", match);
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
  const messagePattern =
    /#{1,6}\s*(You said|ChatGPT said|Claude said|Gemini said|Assistant|User|Human):/gi;

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
    if (
      roleMarker.includes("you") ||
      roleMarker === "user" ||
      roleMarker === "human"
    ) {
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
      "```$1\n",
    );
    // Also handle case where it's just "lang\nCopy code" at start of code block
    cleanContent = cleanContent.replace(
      /```(\w+)\n\1 Copy code\n/gi,
      "```$1\n",
    );
    // Handle standalone "Copy code" lines
    cleanContent = cleanContent.replace(/^Copy code\n/gm, "");

    if (cleanContent) {
      messages.push({ role, content: cleanContent });
    }
  }

  // Try to extract title from first user message
  const firstUserMessage = messages.find((m) => m.role === "user")?.content;
  if (firstUserMessage) {
    // Take first line or up to 60 chars
    const firstLine = firstUserMessage.split("\n")[0].trim();
    title = firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;
  }

  return { title, messages };
}

/**
 * Check if URL is a Gemini shared link
 */
function isGeminiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("gemini.google.com");
  } catch {
    return false;
  }
}

/**
 * Parse markdown content from Gemini shared pages using strict deterministic rules.
 * 
 * Algorithm:
 * 1. Normalize text (CRLF->LF, trim lines, collapse blank lines)
 * 2. Remove boilerplate using regex patterns
 * 3. Split into blocks using double newlines
 * 4. Score each block for "assistant" vs "user" traits
 * 5. Apply alternation guard
 */
export function parseGeminiFromMarkdown(markdown: string): {
  title: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  let title: string | null = null;

  // 1) Normalize text
  let normalized = markdown
    .replace(/\r\n/g, "\n") // Convert CRLF to LF
    .replace(/[ \t]+$/gm, "") // Trim trailing spaces
    .replace(/\n{3,}/g, "\n\n"); // Collapse 3+ blank lines to 2
  
  // MERGE rules: Collapse blank lines before a bullet point so lists stay attached to previous text
  normalized = normalized.replace(/\n{2,}([-*]\s+)/g, "\n$1");

  // Extract title from H1 (# **Title**) or just # Title before stripping boilerplate
  // Regex allows for optional markdown bold/italic markers
  const titleMatch = normalized.match(/^#\s+(?:[*_]{2})?(.+?)(?:[*_]{2})?\s*$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // 2) Remove boilerplate blocks
  const boilerplatePatterns = [
    /^\[Sign in\]\(https?:\/\/accounts\.google\.com\/.*\)$/im,
    /^\[Gemini\]\(https?:\/\/gemini\.google\.com\/app\)$/im,
    /^\[About Gemini.*$/im,
    /^\[Gemini App.*$/im,
    /^\[Subscriptions.*$/im,
    /^\[For Business.*$/im,
    /^#\s+\*\*.*\*\*\s*$/m, // Title line
    /^https?:\/\/gemini\.google\.com\/share\/\S+$/m, // Share link (plain)
    /^\[https?:\/\/gemini\.google\.com\/share\/.*$/m, // Share link (markdown)
    /^Created with .*$/m,
    /^Published .*$/m,
    /^\[Google Privacy Policy.*$/im,
    /^\[Google Terms of Service.*$/im,
    /^Gemini may display inaccurate info.*$/im,
    /^Sign in$/m,
    /^Copy public link$/m,
    /^Report$/m,
  ];

  for (const pattern of boilerplatePatterns) {
    // Replace valid boilerplate lines with empty string
    // We use a loop to handle multiple occurrences if necessary, though most appear once
    // Using split/join or replaceAll is safer for global removal if strict global flag isn't used in regex
    // The user patterns provided have ^, so they match lines.
    // We'll iterate and remove all matching lines.
    const lines = normalized.split("\n");
    const filteredLines = lines.filter((line) => {
      for (const p of boilerplatePatterns) {
        if (p.test(line)) return false;
      }
      return true;
    });
    normalized = filteredLines.join("\n");
  }

  // Re-normalize after stripping lines to ensure clean blocks
  normalized = normalized.replace(/\n{3,}/g, "\n\n").trim();

  // 3) Split into message "blocks"
  // Use 2+ newlines as a separator
  const blocks = normalized.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  if (blocks.length === 0) {
    return { title, messages };
  }

  // 4) Classify each block with deterministic scoring
  const scoredBlocks = blocks.map((block) => {
    let assistantScore = 0;
    let userScore = 0;

    // assistantScore rules
    if (/(How can I help|I can assist|Would you like|Here are|Here's|Sure|Loud and clear)/i.test(block)) {
      assistantScore += 6;
    }
    if (/^[-*]\s+/m.test(block)) {
      assistantScore += 4;
    }
    if (/\*\*[^*]+\*\*/.test(block)) {
      assistantScore += 2;
    }
    if (block.length > 160) {
      assistantScore += 2;
    }
    const sentenceEndings = (block.match(/[.!?](\s|$)/g) || []).length;
    if (sentenceEndings >= 2) {
      assistantScore += 2;
    }

    // userScore rules
    if (block.length <= 80) {
      userScore += 3;
    }
    // Check if NOT a bullet list (no line starts with - or *)
    if (!/^[-*]\s+/m.test(block)) {
      userScore += 1;
    }
    // Check if NOT bold markdown
    if (!/\*\*[^*]+\*\*/.test(block)) {
      userScore += 1;
    }
    // Check if single line
    if (!block.includes("\n")) {
      userScore += 1;
    }

    const role: "user" | "assistant" = assistantScore > userScore ? "assistant" : "user";
    return { role, content: block, assistantScore, userScore };
  });

  // 5) Alternation guard
  // Gemini chats typically alternate user -> assistant.
  // We'll iterate and enforce alternation if scores are close.
  // Assuming strict alternation is desirable: User -> Assistant -> User -> Assistant
  // However, the user said "If two consecutive blocks end up with the same role".
  
  // We'll process from index 1
  for (let i = 1; i < scoredBlocks.length; i++) {
    const prev = scoredBlocks[i - 1];
    const curr = scoredBlocks[i];

    if (prev.role === curr.role) {
      const scoreDiff = Math.abs(curr.assistantScore - curr.userScore);
      // "If the score difference is small (<= 2), flip the current block's role"
      if (scoreDiff <= 2) {
        curr.role = curr.role === "user" ? "assistant" : "user";
      }
      // "If the difference is large, keep it." -> do nothing
    }
  }

  // 6) Output
  return {
    title,
    messages: scoredBlocks.map((b) => ({ role: b.role, content: b.content })),
  };
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
      throw new Error(
        "FIRECRAWL_API_KEY is not set in Convex environment variables",
      );
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

    // Parse the markdown to extract messages based on provider
    // Note: parseGeminiFromMarkdown is now synchronous
    const parsed = isGeminiUrl(args.url)
      ? parseGeminiFromMarkdown(markdown)
      : parseConversationFromMarkdown(markdown);

    // Determine title based on provider
    let finalTitle: string | null = null;

    if (isGeminiUrl(args.url)) {
      // For Gemini, parsed title (H1) is better than generic metadata title
      finalTitle = parsed.title || result.data?.metadata?.title || null;
    } else {
      // For ChatGPT/others, metadata title is usually better than parsed fallback
      finalTitle = result.data?.metadata?.title || parsed.title || null;
    }
    return {
      markdown,
      title: finalTitle,
      messages: parsed.messages,
      metadata: result.data?.metadata || null,
    };
  },
});
