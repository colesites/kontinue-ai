import { ChatMessage } from "@/features/chat/components/ChatMessage";
import { ImageGenerationLoader } from "@/features/chat/components/ImageGenerationLoader";
import { Loader2 } from "lucide-react";
import { DisplayMessage } from "../hooks/useChatMessageTransformer";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  disabled?: boolean;
}

type ChatMessageListProps = {
  messages: DisplayMessage[];
  status: string;
  isStreaming: boolean;
  isGeneratingImage: boolean;
  currentModelId: string;
  modelOptionsWithAccess: Record<string, ModelOption[]> | undefined;
  onRetry: (id: string) => void;
  onSwitchModel: (id: string, modelId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

export function ChatMessageList({
  messages,
  status,
  isStreaming,
  isGeneratingImage,
  currentModelId,
  modelOptionsWithAccess,
  onRetry,
  onSwitchModel,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-3 pb-[150px] sm:px-4 lg:px-3">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          imageParts={message.imageParts}
          isImported={message.isImported}
          isStreaming={
            isStreaming &&
            index === messages.length - 1 &&
            message.role === "assistant"
          }
          onRetry={
            message.role === "assistant" ? () => onRetry(message.id) : undefined
          }
          onSwitchModel={
            message.role === "assistant"
              ? (modelId) => onSwitchModel(message.id, modelId)
              : undefined
          }
          modelOptionsByProvider={
            message.role === "assistant" ? modelOptionsWithAccess : undefined
          }
          currentModelId={currentModelId}
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
  );
}
