"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useSidebar } from "@/components/ui/sidebar";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { useChatContext } from "@/contexts/ChatContext";
import {
  getImportFailureMessage,
  getImportProgressFromTitle,
  isImportParamSet,
} from "@/features/chat/lib/import-status";

// Hooks
import { useChatMessageTransformer } from "../hooks/useChatMessageTransformer";
import { useChatPersistence } from "../hooks/useChatPersistence";
import { useChatState } from "../hooks/useChatState";
import { useScrollManagement } from "../hooks/useScrollManagement";
import { useChatMessaging } from "../hooks/useChatMessaging";
import { useChatLifecycle } from "../hooks/useChatLifecycle";
import { useImportParamCleanup } from "../hooks/useImportParamCleanup";
import { isLikelyImageGenerationRequest } from "@/features/chat/lib/generation";

// Components
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputContainer } from "./ChatInputContainer";
import { ChatStatusView } from "./ChatStatusView";
import { ChatImportStatusBanner } from "@/features/chat/components/ChatImportStatusBanner";

export function ChatClient() {
  const { setChatInfo, clearChatInfo } = useChatContext();
  const { getCapabilities, isPremium } = useModelCapabilities();
  const { state: sidebarState, isMobile: isSidebarMobile } = useSidebar();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = params.chatId as Id<"chats">;

  // 1. Data Fetching
  const chat = useQuery(api.chats.getChat, chatId ? { chatId } : "skip");
  const dbMessages = useQuery(
    api.messages.getMessages,
    chatId ? { chatId } : "skip",
  );
  const chatFiles = useQuery(
    api.files.listByChat,
    chatId ? { chatId } : "skip",
  );
  const addMessage = useMutation(api.messages.addMessage);

  // 2. State Management
  const chatState = useChatState({ chatId });

  // 3. Messaging Logic
  const messaging = useChatMessaging({
    chatId,
    isPremium,
    addMessage,
    getState: () => ({
      selectedModel: chatState.selectedModel,
      webSearchEnabled: chatState.webSearchEnabled,
      imageAspectRatio: chatState.imageAspectRatio,
      imageSize: chatState.imageSize,
    }),
  });

  const { aiMessages, status, stop, setMessages, handleSend, handleRetry } =
    messaging;

  const [persistedImageUrlsByMessageId, setPersistedImageUrlsByMessageId] =
    useState<Record<string, string[]>>({});

  const displayMessages = useChatMessageTransformer({
    aiMessages,
    dbMessages,
    persistedImageUrlsByMessageId,
    chatFiles,
  });

  const { persistAssistantTurn } = useChatPersistence({ chatId, dbMessages });
  const {
    messagesEndRef,
    showScrollToBottomButton,
    showScrollToTopButton,
    scrollToBottom,
    scrollToTop,
  } = useScrollManagement(displayMessages);

  // 4. Lifecycle
  useChatLifecycle({
    chat,
    chatId,
    setChatInfo,
    clearChatInfo,
    dbMessages,
    aiMessages,
    setMessages,
    status,
    consumeDraft: chatState.consumeDraft,
    handleSend,
    displayMessages,
    selectedModel: chatState.selectedModel,
    persistAssistantTurn,
    setPersistedImageUrlsByMessageId,
  });

  useImportParamCleanup({
    dbMessages,
    router,
    searchParams,
  });

  if (chat === undefined || chat === null || dbMessages === undefined) {
    return <ChatStatusView chat={chat} dbMessages={dbMessages} />;
  }

  const importFailureMessage = getImportFailureMessage(dbMessages);
  const hasImportParams = isImportParamSet(searchParams);
  const importProgress = hasImportParams
    ? getImportProgressFromTitle(chat.title)
    : null;
  const isBackgroundImporting =
    hasImportParams && !importFailureMessage
      ? importProgress !== null || dbMessages.length === 0
      : false;

  const isGeneratingImage = isLikelyImageGenerationRequest({
    status,
    selectedModel: chatState.selectedModel,
    getCapabilities,
    displayMessages,
  });

  return (
    <div className="relative flex min-h-full flex-col bg-background">
      <ChatImportStatusBanner
        isBackgroundImporting={isBackgroundImporting}
        importFailureMessage={importFailureMessage}
        importProgress={importProgress}
      />
      <div className="flex-1">
        <ChatMessageList
          messages={displayMessages}
          status={status}
          isStreaming={status === "streaming"}
          isGeneratingImage={isGeneratingImage}
          currentModelId={chatState.selectedModel}
          modelOptionsWithAccess={chatState.modelOptionsWithAccess}
          onRetry={handleRetry}
          onSwitchModel={(id, mid) => {
            chatState.setUserSelectedModel(mid);
            handleRetry(id, mid);
          }}
          messagesEndRef={messagesEndRef}
        />
      </div>

      <ChatInputContainer
        sidebarState={sidebarState}
        isSidebarMobile={isSidebarMobile}
        showScrollToBottomButton={showScrollToBottomButton}
        showScrollToTopButton={showScrollToTopButton}
        onScrollToBottom={scrollToBottom}
        onScrollToTop={scrollToTop}
        onSend={handleSend}
        isLoading={status === "submitted" || status === "streaming"}
        disabled={isBackgroundImporting}
        onStop={stop}
        selectedModel={chatState.selectedModel}
        onModelChange={(next) => chatState.setUserSelectedModel(next)}
        webSearchEnabled={chatState.webSearchEnabled}
        onWebSearchToggle={() =>
          chatState.setWebSearchEnabled((prev: boolean) => !prev)
        }
        imageAspectRatio={chatState.imageAspectRatio}
        imageSize={chatState.imageSize}
        onImageAspectRatioChange={chatState.setImageAspectRatio}
        onImageSizeChange={chatState.setImageSize}
      />
    </div>
  );
}
