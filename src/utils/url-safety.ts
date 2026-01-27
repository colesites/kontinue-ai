import { z } from "zod";

// SSRF protection: Block private networks, localhost, link-local, and metadata IPs
const BLOCKED_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9])\./, // Carrier-grade NAT
  /^198\.18\./,                // Benchmark testing
  /^::1$/,                     // IPv6 loopback
  /^fc00:/,                    // IPv6 unique local
  /^fe80:/,                    // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",           // AWS/GCP metadata
  "metadata.google.com",
];

export function isBlockedHost(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  
  if (BLOCKED_HOSTNAMES.includes(lowerHost)) {
    return true;
  }
  
  for (const pattern of BLOCKED_IP_RANGES) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  
  return false;
}

export const SharedLinkSchema = z.url().refine((url) => {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    // Check for blocked hosts
    if (isBlockedHost(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}, "Invalid or blocked URL");

export type Provider =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "t3chat"
  | "mistral"
  | "perplexity"
  | "deepseek"
  | "unknown";

export function detectProvider(url: string): Provider {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    const path = parsed.pathname.toLowerCase();

    switch (true) {
      case hostname.includes("chat.openai.com") ||
        hostname.includes("chatgpt.com"):
        return "chatgpt";

      case hostname.includes("claude.ai") || hostname.includes("anthropic.com"):
        return "claude";

      case hostname.includes("gemini.google.com") ||
        hostname.includes("aistudio.google.com"):
        return "gemini";

      case hostname.includes("grok.x.ai") ||
        (hostname.includes("x.com") && path.includes("/i/grok")):
        return "grok";

      case hostname.includes("t3chat.com"):
        return "t3chat";

      case hostname.includes("perplexity.ai"):
        return "perplexity";

      case hostname.includes("mistral.ai"):
        return "mistral";

      case hostname.includes("deepseek.com"):
        return "deepseek";

      default:
        return "unknown";
    }
  } catch {
    return "unknown";
  }
}

export function getProviderDisplayName(provider: Provider): string {
  const names: Record<Provider, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    grok: "Grok",
    t3chat: "T3Chat",
    perplexity: "Perplexity",
    mistral: "Mistral",
    deepseek: "DeepSeek",
    unknown: "Unknown",
  };
  return names[provider];
}

export function getProviderColor(provider: Provider): string {
  const colors: Record<Provider, string> = {
    chatgpt: "#10a37f",
    claude: "#cc785c",
    gemini: "#4285f4",
    grok: "#ffffff",
    t3chat: "#f8e6f4",
    perplexity: "#20b8cd",
    mistral: "#ffffff",
    deepseek: "#ffffff",
    unknown: "#6b7280",
  };
  return colors[provider];
}

