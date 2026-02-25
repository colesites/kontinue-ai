"use client";

import { useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";
import {
  getChatErrorToast,
  nonImageAttachments,
  toImageFileUIParts,
  toChatRequestBody,
  trimMessagesToRetryTarget,
  withAttachmentSummary,
} from "@/features/chat/lib/chat-messaging";

interface UseChatMessagingProps {
  chatId: Id<"chats">;
  isPremium: (modelId: string) => boolean;
  addMessage: (args: {
    chatId: Id<"chats">;
    role: "user" | "assistant";
    content: string;
    isPremiumModel?: boolean;
    model?: string;
  }) => Promise<Id<"messages">>;
  getState: () => {
    selectedModel: string;
    webSearchEnabled: boolean;
    imageAspectRatio: string;
    imageSize: string | null;
  };
}

type ConvexRateLimitError = {
  data?: { code?: string; message?: string };
};

export function useChatMessaging({
  chatId,
  isPremium,
  addMessage,
  getState,
}: UseChatMessagingProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const chatHelpers = useChat({
    transport,
    experimental_throttle: 50,
    onError: (err) => {
      console.error("AI chat error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      const toastMessage = getChatErrorToast(msg);
      toast.error(toastMessage.title, { description: toastMessage.description });
    },
  });

  const {
    messages: aiMessages,
    status,
    sendMessage,
    stop,
    setMessages,
    regenerate,
  } = chatHelpers;

  const handleSend = useCallback(
    async (content: string, files?: File[]) => {
      try {
        const state = getState();

        await addMessage({
          chatId,
          role: "user",
          content,
          isPremiumModel: isPremium(state.selectedModel),
        });
        const requestBody = toChatRequestBody(state);
        const imageFileParts = await toImageFileUIParts(files);
        const nonImageFiles = nonImageAttachments(files);
        const contentWithFiles = withAttachmentSummary(content, nonImageFiles);

        await sendMessage(
          imageFileParts.length > 0
            ? { text: contentWithFiles, files: imageFileParts }
            : { text: contentWithFiles },
          {
            body: requestBody,
          },
        );
      } catch (err: unknown) {
        const convexError = err as ConvexRateLimitError;
        if (convexError.data?.code?.includes("RATE_LIMIT")) {
          toast.error(convexError.data.message);
          return;
        }
        throw err;
      }
    },
    [addMessage, chatId, isPremium, sendMessage, getState],
  );

  const handleRetry = useCallback(
    (id: string, modelOverride?: string) => {
      if (typeof regenerate !== "function") return;
      setMessages((prev: UIMessage[]) => {
        return trimMessagesToRetryTarget(prev, id);
      });
      const state = getState();

      regenerate({
        body: {
          ...toChatRequestBody(state),
          model: modelOverride ?? state.selectedModel,
        },
      });
    },
    [regenerate, setMessages, getState],
  );

  return {
    aiMessages,
    status,
    stop,
    setMessages,
    handleSend,
    handleRetry,
    sendMessage,
  };
}
