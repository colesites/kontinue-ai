"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { AlertTriangle, ArrowDown, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ChatMessage } from "@/features/chat/components/ChatMessage";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { getDefaultModel } from "@/lib/models";
import { useSidebar } from "@/components/ui/sidebar";

export function ChatClient() {
  const params = useParams();
  const chatId = params.chatId as Id<"chats">;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastSavedAssistantIdRef = useRef<string | null>(null);
  const hasSeededRef = useRef(false);

  // Fetch chat and messages from Convex
  const chat = useQuery(api.chats.getChat, { chatId });
  const dbMessages = useQuery(api.messages.getMessages, { chatId });
  const addMessage = useMutation(api.messages.addMessage);
  const { state: sidebarState, isMobile: isSidebarMobile } = useSidebar();

  // Create transport with model
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { model: selectedModel },
      }),
    [selectedModel]
  );

  // AI chat hook - new v5 API
  const chatHelpers = useChat({
    transport,
    onError: (err) => {
      console.error("AI chat error:", err);
    },
  });

  const { messages: aiMessages, status, error: chatError } = chatHelpers;

  // Cast to any to access append if it exists (it should in v5, despite the type definition issue)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const append = (chatHelpers as any).append;
  const sendMessage = chatHelpers.sendMessage;
  const setMessages = chatHelpers.setMessages;

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTriggeredImportRef = useRef(false);

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

  // Convert DB messages to UI format for display
  const displayMessages = useMemo(() => {
    // Prefer AI SDK messages once available (includes optimistic new messages).
    if (aiMessages.length > 0) {
      return aiMessages
        .filter((msg) => !msg.id.startsWith("import-trigger-"))
        .map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.parts
            .filter(
              (part): part is { type: "text"; text: string } =>
                part.type === "text",
            )
            .map((part) => part.text)
            .join(""),
          isImported: importedById[msg.id] ?? false,
        }));
    }

    // Fallback to DB messages before the hook is seeded/ready
    return (dbMessages ?? []).map((msg) => ({
      id: msg._id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      isImported: msg.metadata?.isImported ?? false,
    }));
  }, [dbMessages, aiMessages, importedById]);

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

  const handleSend = async (content: string) => {
    // Reset saved tracking for new stream
    lastSavedAssistantIdRef.current = null;

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

    // Send to AI
    sendMessage({
      text: content,
    });
  };

  // Persist assistant messages when streaming completes
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

    const content = lastMessage.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text"
      )
      .map((part) => part.text)
      .join("");

    if (content) {
      lastSavedAssistantIdRef.current = lastMessage.id;
      addMessage({
        chatId,
        role: "assistant",
        content,
        model: selectedModel,
      });
    }
  }, [status, aiMessages, dbMessages, chatId, addMessage, selectedModel]);

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
    <div className="relative flex min-h-full flex-col bg-zinc-950">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 pb-[200px]">
          {!!chatError && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="font-semibold">AI didn’t respond</p>
                  <p className="mt-1 text-sm text-amber-200/80 wrap-break-word">
                    {chatError.message}
                  </p>
                  <p className="mt-2 text-xs text-amber-200/70">
                    Set{" "}
                    <code className="rounded border border-amber-500/20 bg-amber-500/10 px-1 py-0.5">
                      AI_GATEWAY_API_KEY
                    </code>{" "}
                    (or{" "}
                    <code className="rounded border border-amber-500/20 bg-amber-500/10 px-1 py-0.5">
                      AI_GATEWAY_TOKEN
                    </code>
                    ) in your env and restart the dev server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {displayMessages.map((message, index) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isImported={message.isImported}
              isStreaming={
                isStreaming &&
                index === displayMessages.length - 1 &&
                message.role === "assistant"
              }
            />
          ))}

          {status === "submitted" && (
            <div className="flex gap-4 px-4 py-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Thinking</span>
                <span className="flex gap-0.5">
                  <span className="typing-dot h-1 w-1 rounded-full bg-zinc-400" />
                  <span className="typing-dot h-1 w-1 rounded-full bg-zinc-400" />
                  <span className="typing-dot h-1 w-1 rounded-full bg-zinc-400" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        data-sidebar-state={sidebarState}
        className="pointer-events-none fixed bottom-0 z-40 px-4 pb-6 transition-[left,width] duration-300"
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
            disabled={!!chatError}
            model={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
}
