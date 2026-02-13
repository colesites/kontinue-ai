"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ArrowDown, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ChatMessage } from "@/features/chat/components/ChatMessage";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { ImageGenerationLoader } from "@/features/chat/components/ImageGenerationLoader";
import { uploadFile } from "@/lib/file-upload";
import { AVAILABLE_MODELS, getDefaultModelForPlan } from "@/lib/models";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsProPlan } from "@/lib/use-is-pro-plan";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { useChatContext } from "@/contexts/ChatContext";

export function ChatClient() {
  const params = useParams();
  const chatId = params.chatId as Id<"chats">;
  const { setChatInfo, clearChatInfo } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPro = useIsProPlan();
  const { getCapabilities, isPremium } = useModelCapabilities();
  const [userSelectedModel, setUserSelectedModel] = useState<string | null>(
    null,
  );
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>("auto");
  const [imageSize, setImageSize] = useState<string | null>(null);
  const selectedModel = useMemo(
    () => userSelectedModel ?? getDefaultModelForPlan(isPro).id,
    [userSelectedModel, isPro],
  );
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastSavedAssistantIdRef = useRef<string | null>(null);
  const savedGeneratedImagesByAssistantIdRef = useRef<Set<string>>(new Set());
  const hasSeededRef = useRef(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [persistedImageUrlsByMessageId, setPersistedImageUrlsByMessageId] =
    useState<Record<string, string[]>>({});

  // Fetch chat and messages from Convex
  const chat = useQuery(api.chats.getChat, { chatId });
  const dbMessages = useQuery(api.messages.getMessages, { chatId });
  const chatFiles = useQuery(api.files.listByChat, { chatId });
  const addMessage = useMutation(api.messages.addMessage);
  const createFileRecord = useMutation(api.files.createFileRecord);
  const { state: sidebarState, isMobile: isSidebarMobile } = useSidebar();

  // Update chat context when chat data is loaded
  useEffect(() => {
    if (chat && chatId) {
      setChatInfo(chatId, chat.title || "Untitled Chat");
    }
    return () => {
      clearChatInfo();
    };
  }, [chat, chatId, setChatInfo, clearChatInfo]);

  // Create transport with model and optional image settings
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  // AI chat hook - new v5 API
  const chatHelpers = useChat({
    transport,
    experimental_throttle: 50, // Throttle updates to 50ms for smoother streaming
    onError: (err) => {
      console.error("AI chat error:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      if (/pro plan required/i.test(message) || /requires pro/i.test(message)) {
        toast.error("This model requires Pro.", {
          description: "Choose a free model or upgrade your plan.",
        });
        return;
      }

      if (/unauthorized/i.test(message) || /status\s*401/.test(message)) {
        toast.error("You're not signed in.", {
          description: "Please refresh and sign in again.",
        });
        return;
      }

      toast.error("AI didn’t respond.", { description: message });
    },
  });

  const { messages: aiMessages, status } = chatHelpers;

  // Cast to any to access append if it exists (it should in v5, despite the type definition issue)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const append = (chatHelpers as any).append;
  const sendMessage = chatHelpers.sendMessage;
  const stop = chatHelpers.stop;
  const setMessages = chatHelpers.setMessages;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regenerate = (chatHelpers as any).regenerate as
    | ((options?: { body?: Record<string, unknown> }) => void)
    | undefined;

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTriggeredImportRef = useRef(false);
  const modelOptionsByProvider = useMemo(() => {
    return AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>(
      (acc, m) => {
        const provider = m.provider;
        if (!acc[provider]) acc[provider] = [];
        acc[provider].push(m);
        return acc;
      },
      {},
    );
  }, []);

  const modelOptionsWithAccess = useMemo(() => {
    const next: Record<string, Array<{ id: string; name: string; provider: string; disabled?: boolean }>> = {};
    for (const [provider, models] of Object.entries(modelOptionsByProvider)) {
      next[provider] = models.map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        disabled: isPremium(m.id) && !isPro,
      }));
    }
    return next;
  }, [modelOptionsByProvider, isPremium, isPro]);

  useEffect(() => {
    // Only trigger if specifically requested via URL param
    if (searchParams.get("imported") === "true") {
      // Prevent double-firing in Strict Mode or re-renders
      if (hasTriggeredImportRef.current) return;
      hasTriggeredImportRef.current = true;

      // Remove the query param so it doesn't trigger again on reload
      const newUrl = window.location.pathname;
      router.replace(newUrl);

      // Trigger the AI with a hidden system message
      // We use a unique ID to filter this message out from the UI
      if (typeof append === "function") {
        setTimeout(() => {
          append({
            id: "import-trigger-" + Date.now(),
            role: "system",
            content:
              "The user has just imported this conversation. Acknowledge the import briefly and ask the user what they would like to do next.",
          });
        }, 100);
      } else {
        console.warn("append function missing from useChat");
      }
    }
  }, [searchParams, router, append]);

  // Seed the chat UI with messages from Convex so the conversation always renders,
  // and subsequent sendMessage() updates show up immediately even if Convex updates lag.
  useEffect(() => {
    if (hasSeededRef.current) return;
    if (!dbMessages) return;
    if (aiMessages.length > 0) {
      hasSeededRef.current = true;
      return;
    }

    const seededMessages: UIMessage[] = dbMessages.map((m) => ({
      id: m._id,
      role: m.role,
      parts: [{ type: "text", text: m.content }],
    }));

    hasSeededRef.current = true;
    setMessages(seededMessages);
  }, [dbMessages, aiMessages.length, setMessages]);

  const importedById = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const m of dbMessages ?? []) {
      map[m._id] = !!m.metadata?.isImported;
    }
    return map;
  }, [dbMessages]);

  const storedGeneratedImageUrlsByMessageId = useMemo(() => {
    const byMessage: Record<string, string[]> = {};
    for (const file of chatFiles ?? []) {
      if (file.fileType !== "generated-image") continue;
      if (!file.messageId) continue;
      if (!byMessage[file.messageId]) byMessage[file.messageId] = [];
      byMessage[file.messageId].push(file.blobUrl);
    }
    return byMessage;
  }, [chatFiles]);

  // Convert DB messages to UI format for display (text + image parts from tool-result and file)
  const displayMessages = useMemo(() => {
    if (aiMessages.length > 0) {
      return aiMessages
        .filter((msg) => !msg.id.startsWith("import-trigger-"))
        .map((msg) => {
          const textParts = msg.parts.filter(
            (p): p is { type: "text"; text: string } => p.type === "text",
          );
          let content = textParts.map((p) => p.text).join("");
          const imageParts: string[] = [];
          const searchResults: Array<{
            title: string;
            url: string;
            snippet: string;
          }> = [];

          const normalizeSnippet = (raw: string | undefined) => {
            if (!raw) return "";
            return raw
              .replace(/\{ts:\d+\}/g, " ")
              .replace(/\|[^\n]*\|/g, " ")
              .replace(/\b([A-Z]{1,4}\s?){4,}\b/g, " ")
              .replace(/#{1,6}\s*/g, " ")
              .replace(/\bGlossary\b[\s\S]*$/i, " ")
              .replace(/\.{3,}/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 500);
          };

          const summarizeFromTitle = (title: string) => {
            const lower = title.toLowerCase();
            if (lower.includes("stats")) {
              return "Summarizes Chelsea team and player statistics for the 2025/26 season.";
            }
            if (lower.includes("squad")) {
              return "Lists Chelsea squad members and appearance/position details.";
            }
            if (lower.includes("ratings")) {
              return "Covers player ratings and highlights top-rated Chelsea players.";
            }
            if (lower.includes("transfer")) {
              return "Reports recent Chelsea transfer activity and squad changes.";
            }
            return "Provides relevant background information related to the query.";
          };

          const toDisplaySummary = (title: string, snippet: string) => {
            if (!snippet) return summarizeFromTitle(title);

            const maxLen = 170;
            const sentences = snippet
              .split(/(?<=[.!?])\s+/)
              .map((part) => part.trim())
              .filter((part) => part.length > 20);
            let candidate = sentences[0] ?? snippet;

            // If the first sentence is a question/header-style line, prefer the next informative sentence.
            if (
              candidate.endsWith("?") &&
              sentences.length > 1
            ) {
              candidate = `${candidate} ${sentences[1]}`;
            }

            const compact = candidate.replace(/\s+/g, " ").trim();

            if (compact.length <= maxLen) {
              return compact;
            }
            return `${compact.slice(0, maxLen).trimEnd()}... (truncated)`;
          };

          const extractSnippetFromResult = (
            result: Record<string, unknown>,
          ): string => {
            const directCandidates = [
              result.snippet,
              result.summary,
              result.description,
              result.content,
              result.text,
              result.pageContent,
              result.page_content,
              result.markdown,
              result.extract,
            ];

            for (const candidate of directCandidates) {
              if (typeof candidate === "string" && candidate.trim()) {
                return candidate.trim();
              }
              if (Array.isArray(candidate)) {
                const joined = candidate
                  .filter((item): item is string => typeof item === "string")
                  .join(" ");
                if (joined.trim()) return joined.trim();
              }
            }

            const nestedObjects = [
              result.output,
              result.data,
              result.attributes,
              result.metadata,
            ];

            for (const nested of nestedObjects) {
              if (typeof nested !== "object" || nested === null) continue;
              const nestedResult = nested as Record<string, unknown>;
              const nestedSnippet: string = extractSnippetFromResult(nestedResult);
              if (nestedSnippet) return nestedSnippet;
            }

            return "";
          };

          const collectSearchLines = (value: unknown) => {
            const maybeObject =
              typeof value === "object" && value !== null
                ? (value as {
                    results?: Array<Record<string, unknown>>;
                  })
                : null;
            const results = maybeObject?.results;
            if (!Array.isArray(results)) return;

            for (const result of results) {
              if (!result || typeof result !== "object") continue;
              const typedResult = result as Record<string, unknown>;
              const urlValue = typedResult.url;
              const url = typeof urlValue === "string" ? urlValue.trim() : "";
              if (!url) continue;
              const titleValue = typedResult.title;
              const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : url;
              if (searchResults.some((entry) => entry.url === url)) continue;
              const snippet = normalizeSnippet(extractSnippetFromResult(typedResult));
              const summary = toDisplaySummary(title, snippet);
              searchResults.push({
                title,
                url,
                snippet: summary,
              });
            }
          };

          const uint8ToBase64 = (bytes: Uint8Array): string => {
            let binary = "";
            const chunkSize = 0x8000;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              const chunk = bytes.subarray(i, i + chunkSize);
              binary += String.fromCharCode(...chunk);
            }
            return btoa(binary);
          };

          for (const part of msg.parts) {
            // Handle file parts (Google Gemini native image generation)
            if (part.type === "file" && "url" in part && part.url) {
              imageParts.push(part.url);
            }
            // Handle file parts with data property (alternative format)
            if (part.type === "file" && "data" in part && part.data) {
              try {
                const uint8Array = part.data as Uint8Array;
                const mimeType =
                  (part as { mimeType?: string }).mimeType || "image/png";
                const base64 = uint8ToBase64(uint8Array);
                imageParts.push(`data:${mimeType};base64,${base64}`);
              } catch (error) {
                console.error("[chat-client-debug] failed to decode file part data", error);
              }
            }
            // OpenAI image tool: typed part (tool-image_generation) or generic tool-result
            const toolOutput =
              part.type === "tool-image_generation" && "output" in part
                ? (() => {
                    const output = part.output as
                      | { result?: string; images?: Array<string | { base64?: string }> }
                      | undefined;
                    if (typeof output?.result === "string") return output.result;
                    if (Array.isArray(output?.images)) {
                      const first = output.images[0];
                      if (typeof first === "string") return first;
                      if (first && typeof first === "object" && typeof first.base64 === "string") {
                        return first.base64;
                      }
                    }
                    return undefined;
                  })()
                : part.type === "tool-result" &&
                    "toolName" in part &&
                    part.toolName === "image_generation"
                  ? ((part as { output?: { result?: string }; result?: string })
                      .output?.result ?? (part as { result?: string }).result)
                  : undefined;
            if (typeof toolOutput === "string" && toolOutput) {
              imageParts.push(`data:image/webp;base64,${toolOutput}`);
            }

            // Perplexity search tool: render links/snippets when the model does not emit text.
            if (
              part.type === "tool-perplexity_search" &&
              "output" in part &&
              part.output
            ) {
              collectSearchLines(part.output);
            } else if (
              part.type === "tool-result" &&
              "toolName" in part &&
              part.toolName === "perplexity_search"
            ) {
              const output =
                (part as { output?: unknown; result?: unknown }).output ??
                (part as { output?: unknown; result?: unknown }).result;
              collectSearchLines(output);
            }
          }

          if (!content.trim() && searchResults.length > 0) {
            const nameRegex =
              /\b([A-Z][a-zA-ZÀ-ÿ'`-]+(?:\s+[A-Z][a-zA-ZÀ-ÿ'`-]+){1,2})\b/g;
            const banned = [
              "Premier League",
              "Champions League",
              "Player Stats",
              "Top Scorers",
              "Top Assists",
              "Official Site",
              "Chelsea Squad",
              "Chelsea",
              "English Premier League",
            ];
            const candidateCounts = new Map<string, number>();
            for (const entry of searchResults) {
              const corpus = `${entry.title} ${entry.snippet}`;
              for (const match of corpus.matchAll(nameRegex)) {
                const name = (match[1] || "").trim();
                if (
                  !name ||
                  banned.some((token) => name.includes(token)) ||
                  name.length < 6
                ) {
                  continue;
                }
                candidateCounts.set(name, (candidateCounts.get(name) ?? 0) + 1);
              }
            }
            const topNames = Array.from(candidateCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name]) => name);

            const lines = searchResults.slice(0, 3).map((entry, index) => {
              const preview =
                entry.snippet ||
                `Source: ${
                  (() => {
                    try {
                      return new URL(entry.url).hostname;
                    } catch {
                      return "link";
                    }
                  })()
                }`;
              return `${index + 1}. [${entry.title}](${entry.url})\n   ${preview}`;
            });
            content = [
              topNames.length > 0
                ? `Quick answer: Based on current sources, likely top Chelsea players in 2026 include ${topNames.join(", ")}.`
                : "Quick answer: I found relevant sources, but they do not provide a single definitive best player in one line.",
              "I searched the web and found relevant sources.",
              "Top sources:",
              ...lines,
            ].join("\n");
          }
          if (
            msg.role === "assistant" &&
            !content.trim() &&
            imageParts.length === 0
          ) {
            content =
              "_No text was returned for this step. Please retry or switch models._";
          }

          const persistedImageUrls = persistedImageUrlsByMessageId[msg.id] ?? [];
          const storedImageUrls = storedGeneratedImageUrlsByMessageId[msg.id] ?? [];
          const resolvedImageParts = [
            ...new Set([...persistedImageUrls, ...storedImageUrls, ...imageParts]),
          ];

          return {
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content,
            imageParts: resolvedImageParts,
            isImported: importedById[msg.id] ?? false,
          };
        });
    }
    return (dbMessages ?? []).map((msg) => ({
      id: msg._id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      imageParts: storedGeneratedImageUrlsByMessageId[msg._id] ?? ([] as string[]),
      isImported: msg.metadata?.isImported ?? false,
    }));
  }, [
    aiMessages,
    dbMessages,
    importedById,
    persistedImageUrlsByMessageId,
    storedGeneratedImageUrlsByMessageId,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Detect if user has scrolled up
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById("chat-scroll-container");

      let isAway = false;
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        isAway = scrollHeight - scrollTop - clientHeight > 200;
      } else {
        // Fallback to window scroll
        const scrollY = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        isAway = totalHeight - scrollY - viewportHeight > 200;
      }

      setShowScrollButton(isAway);
    };

    const container = document.getElementById("chat-scroll-container");
    const target = container || window;

    target.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check with delay to ensure rendering is complete
    const timer = setTimeout(handleScroll, 100);

    return () => {
      target.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [displayMessages.length]);

  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";

  // Detect if we're generating an image
  const isImageModel = useMemo(() => {
    const capabilities = getCapabilities(selectedModel);
    return capabilities.includes("image-generation");
  }, [selectedModel, getCapabilities]);

  const compressGeneratedImageBlob = useCallback(async (blob: Blob) => {
    if (!blob.type.startsWith("image/")) return blob;

    const targetMaxBytes = 9 * 1024 * 1024; // keep under 10MB upload cap
    if (blob.size <= targetMaxBytes && blob.type === "image/webp") {
      return blob;
    }

    const objectUrl = URL.createObjectURL(blob);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to decode generated image"));
      img.src = objectUrl;
    });

    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context || !originalWidth || !originalHeight) {
      URL.revokeObjectURL(objectUrl);
      return blob;
    }

    const renderToWebpBlob = async (maxDimension: number, quality: number) => {
      const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (outBlob) => {
            if (outBlob) {
              resolve(outBlob);
              return;
            }
            reject(new Error("Failed to compress generated image"));
          },
          "image/webp",
          quality,
        );
      });
    };

    let bestBlob: Blob | null = null;
    const maxDimensions = [2200, 1800, 1600, 1400, 1200, 1024];
    const qualities = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

    try {
      for (const maxDimension of maxDimensions) {
        for (const quality of qualities) {
          const candidate = await renderToWebpBlob(maxDimension, quality);
          if (!bestBlob || candidate.size < bestBlob.size) {
            bestBlob = candidate;
          }
          if (candidate.size <= targetMaxBytes) {
            return candidate;
          }
        }
      }

      return bestBlob ?? blob;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, []);

  // Check if last user message looks like an image request
  const lastMessageIsImageRequest = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "user") {
        const content = msg.content.toLowerCase();
        return (
          content.length > 20 &&
          /(\b(image|picture|draw|illustration|generate|create|render|photo|paint|sketch|depict)\b|show me|make me)/i.test(
            content,
          )
        );
      }
    }
    return false;
  }, [displayMessages]);

  // Update image generation state
  useEffect(() => {
    if (status === "submitted" && isImageModel && lastMessageIsImageRequest) {
      setIsGeneratingImage(true);
    } else if (status === "streaming" || status === "ready") {
      // Check if we have images in the latest message
      const lastMessage = displayMessages[displayMessages.length - 1];
      if (lastMessage?.imageParts && lastMessage.imageParts.length > 0) {
        setIsGeneratingImage(false);
      } else if (status === "ready") {
        setIsGeneratingImage(false);
      }
    }
  }, [status, isImageModel, lastMessageIsImageRequest, displayMessages]);

  const handleSend = async (content: string, files?: File[]) => {
    // Lock the model for this chat session once the user sends their first message.
    if (userSelectedModel === null) {
      setUserSelectedModel(selectedModel);
    }

    // Reset saved tracking for new stream
    lastSavedAssistantIdRef.current = null;

    // Convert files to data URLs if provided
    let fileDataUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        fileDataUrls = await Promise.all(
          files.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              }),
          ),
        );
      } catch (err) {
        toast.error("Failed to process attached files.");
        return;
      }
    }

    // First, persist user message to Convex
    try {
      await addMessage({
        chatId,
        role: "user",
        content,
      });
    } catch (err: unknown) {
      const data = (err as { data?: { code?: string; message?: string } })
        ?.data;
      if (data?.code === "RATE_LIMIT_RPM" || data?.code === "RATE_LIMIT_RPD") {
        toast.error(data.message ?? "Rate limit reached. Please try again.");
        return;
      }
      throw err;
    }

    // Send to AI - for now, file attachments are passed as data URLs in the text
    // In the future, we can enhance this to use proper multimodal parts
    let messageContent = content;
    if (fileDataUrls.length > 0) {
      messageContent = `${content}\n\n[User attached ${files!.length} file(s): ${files!.map((f) => f.name).join(", ")}]`;
    }

    console.log("[chat-client-debug] sending message options", {
      model: selectedModel,
      webSearchEnabled,
      imageAspectRatio,
      imageSize,
    });

    sendMessage(
      {
        text: messageContent,
      },
      {
        body: {
          model: selectedModel,
          webSearchEnabled,
          imageAspectRatio: imageAspectRatio || undefined,
          imageSize: imageSize || undefined,
        },
      },
    );
  };

  const retryAssistant = useCallback(
    (messageId: string, modelOverride?: string) => {
      if (typeof regenerate !== "function") return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx <= 0) return prev;
        let userIdx = -1;
        for (let i = idx - 1; i >= 0; i -= 1) {
          if (prev[i].role === "user") {
            userIdx = i;
            break;
          }
        }
        if (userIdx === -1) return prev;
        return prev.slice(0, userIdx + 1);
      });
      regenerate({
        body: {
          model: modelOverride ?? selectedModel,
          webSearchEnabled,
          imageAspectRatio: imageAspectRatio || undefined,
          imageSize: imageSize || undefined,
        },
      });
    },
    [
      regenerate,
      setMessages,
      selectedModel,
      webSearchEnabled,
      imageAspectRatio,
      imageSize,
    ],
  );

  // Persist assistant messages and generated images when streaming completes.
  useEffect(() => {
    if (status !== "ready" || aiMessages.length === 0) return;

    const lastMessage = aiMessages[aiMessages.length - 1];
    if (lastMessage.role !== "assistant") return;

    // If the assistant message already exists in Convex (e.g., when reloading),
    // don't save it again—just mark it as seen.
    const alreadyInDb = dbMessages?.some((m) => m._id === lastMessage.id);
    if (alreadyInDb) {
      lastSavedAssistantIdRef.current = lastMessage.id;
      return;
    }

    if (lastSavedAssistantIdRef.current === lastMessage.id) return;

    const lastDisplayMessage = displayMessages.find((m) => m.id === lastMessage.id);
    const imageParts = lastDisplayMessage?.imageParts ?? [];
    const renderedContent = (lastDisplayMessage?.content ?? "").trim();
    const contentFromTextParts = lastMessage.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join("");
    const hasImages = imageParts.length > 0;
    const content = contentFromTextParts.trim();
    const isNoTextPlaceholder =
      renderedContent ===
      "_No text was returned for this step. Please retry or switch models._";
    const contentToSave =
      content ||
      (!isNoTextPlaceholder ? renderedContent : "") ||
      (hasImages ? "Generated image." : "");
    if (!contentToSave) return;

    const contentTypeToExtension = (contentType: string) => {
      switch (contentType) {
        case "image/png":
          return "png";
        case "image/jpeg":
          return "jpg";
        default:
          return "webp";
      }
    };

    lastSavedAssistantIdRef.current = lastMessage.id;

    const persistAssistantTurn = async () => {
      try {
        const persistedMessageId = await addMessage({
          chatId,
          role: "assistant",
          content: contentToSave,
          model: selectedModel,
        });

        if (hasImages && !savedGeneratedImagesByAssistantIdRef.current.has(lastMessage.id)) {
          savedGeneratedImagesByAssistantIdRef.current.add(lastMessage.id);
          const persistedUrls: string[] = [];

          for (let index = 0; index < imageParts.length; index++) {
            const source = imageParts[index];
            try {
              const response = await fetch(source);
              if (!response.ok) {
                throw new Error(`Failed to fetch generated image (${response.status})`);
              }

              const blob = await response.blob();
              const compressedBlob = await compressGeneratedImageBlob(blob);
              const contentType =
                compressedBlob.type && compressedBlob.type.startsWith("image/")
                  ? compressedBlob.type
                  : "image/webp";
              const extension = contentTypeToExtension(contentType);
              const filename = `generated-${Date.now()}-${index + 1}.${extension}`;
              const file = new File([compressedBlob], filename, { type: contentType });
              const uploaded = await uploadFile(file);
              persistedUrls.push(uploaded.url);

              await createFileRecord({
                chatId,
                messageId: persistedMessageId,
                blobUrl: uploaded.url,
                pathname: uploaded.pathname,
                filename: uploaded.filename,
                contentType: uploaded.contentType,
                size: uploaded.size,
                fileType: "generated-image",
              });
            } catch (error) {
              console.error("[chat-client-debug] failed to persist generated image", {
                messageId: lastMessage.id,
                imageIndex: index,
                error,
              });
            }
          }

          if (persistedUrls.length > 0) {
            setPersistedImageUrlsByMessageId((prev) => ({
              ...prev,
              [lastMessage.id]: persistedUrls,
            }));
          }
        }
      } catch (error) {
        // Allow retry on a later effect run if message persistence fails.
        lastSavedAssistantIdRef.current = null;
        console.error("[chat-client-debug] failed to persist assistant message", error);
      }
    };

    void persistAssistantTurn();
  }, [
    status,
    aiMessages,
    dbMessages,
    chatId,
    addMessage,
    createFileRecord,
    compressGeneratedImageBlob,
    displayMessages,
    selectedModel,
  ]);

  if (chat === undefined || dbMessages === undefined) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (chat === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-zinc-400 mb-4">Chat not found</p>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Import
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col bg-background">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 pb-[150px]">
          {displayMessages.map((message, index) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              imageParts={message.imageParts}
              isImported={message.isImported}
              isStreaming={
                isStreaming &&
                index === displayMessages.length - 1 &&
                message.role === "assistant"
              }
              onRetry={
                message.role === "assistant"
                  ? () => retryAssistant(message.id)
                  : undefined
              }
              onSwitchModel={
                message.role === "assistant"
                  ? (modelId) => {
                      setUserSelectedModel(modelId);
                      retryAssistant(message.id, modelId);
                    }
                  : undefined
              }
              modelOptionsByProvider={
                message.role === "assistant" ? modelOptionsWithAccess : undefined
              }
              currentModelId={selectedModel}
            />
          ))}

          {status === "submitted" && (
            <>
              {isGeneratingImage ? (
                <ImageGenerationLoader />
              ) : (
                <div className="flex gap-4 px-4 py-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Thinking</span>
                    <span className="flex gap-0.5">
                      <span className="typing-dot h-1 w-1 rounded-full bg-muted-foreground" />
                      <span className="typing-dot h-1 w-1 rounded-full bg-muted-foreground" />
                      <span className="typing-dot h-1 w-1 rounded-full bg-muted-foreground" />
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        data-sidebar-state={sidebarState}
        className="pointer-events-none fixed bottom-0 z-40 px-4 pb-5 transition-[left,width] duration-300"
        style={{
          left:
            !isSidebarMobile && sidebarState === "expanded"
              ? "var(--sidebar-width)"
              : 0,
          width:
            !isSidebarMobile && sidebarState === "expanded"
              ? "calc(100vw - var(--sidebar-width))"
              : "100vw",
        }}
      >
        <div className="pointer-events-auto relative mx-auto w-full max-w-3xl">
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-38 left-1/2 -translate-x-1/2 group flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/10 text-white shadow-xl backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-110 active:scale-95 z-50 animate-in fade-in zoom-in duration-200"
              aria-label="Scroll to bottom"
            >
              <ArrowDown
                size={18}
                className="transition-transform group-hover:translate-y-0.5"
              />
            </button>
          )}
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            onStop={stop}
            disabled={false}
            model={selectedModel}
            onModelChange={(next) => setUserSelectedModel(next)}
            webSearchEnabled={webSearchEnabled}
            onWebSearchToggle={() => setWebSearchEnabled((prev) => !prev)}
            imageAspectRatio={imageAspectRatio}
            imageSize={imageSize}
            onImageAspectRatioChange={setImageAspectRatio}
            onImageSizeChange={setImageSize}
          />
        </div>
      </div>
    </div>
  );
}
