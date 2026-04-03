"use client";

import { cn } from "@/utils/cn";
import type { ChatMessageProps } from "@/features/chat/types";
import { MessageContent } from "./MessageContent";
import { ChatMessageActions } from "./ChatMessageActions";
import { ChatMessageImages } from "./ChatMessageImages";

const EMPTY_IMAGE_PARTS: string[] = [];

export function ChatMessage({
  role,
  content,
  imageParts = EMPTY_IMAGE_PARTS,
  isImported,
  isStreaming,
  onRetry,
  onSwitchModel,
  modelOptionsByProvider,
  currentModelId,
}: ChatMessageProps) {
  if (role === "system") return null;

  const isUser = role === "user";
  const isImageOnly = !content.trim() && imageParts.length > 0;

  return (
    <div
      className={cn("py-3", isUser ? "flex justify-end" : "flex justify-start")}
    >
      <div
        className={cn(
          "group max-w-[92%] sm:max-w-[85%]",
          isUser ? "ml-auto w-fit" : "w-fit",
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl border",
            isImageOnly ? "px-3 py-3" : "px-4 py-3",
            "shadow-sm shadow-black/20",
            isUser
              ? "bg-primary/10 border-primary/20"
              : "bg-muted border-border",
          )}
        >
          <div
            className={cn(
              "prose max-w-none break-words dark:prose-invert [overflow-wrap:anywhere]",
              "prose-p:leading-relaxed prose-p:mt-0 prose-p:mb-4 last:prose-p:mb-0",
              "prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3",
              "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
              "prose-ul:my-3 prose-ul:list-disc prose-ul:pl-6",
              "prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-6",
              "prose-li:my-1",
              "prose-p:break-words prose-li:break-words prose-a:break-all",
              "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-3",
              "prose-hr:my-4 prose-hr:border-border",
              "prose-strong:font-bold prose-strong:text-foreground",
              "prose-em:italic",
              "prose-code:text-sm prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded prose-code:font-medium",
            )}
          >
            {content ? (
              <MessageContent content={content} isStreaming={isStreaming} />
            ) : null}
            <ChatMessageImages imageParts={imageParts} />
          </div>
        </div>

        {/* Actions UNDER the bubble (both roles) */}
        {!isStreaming && (
          <ChatMessageActions
            content={content}
            isUser={isUser}
            onRetry={onRetry}
            onSwitchModel={onSwitchModel}
            modelOptionsByProvider={modelOptionsByProvider}
            currentModelId={currentModelId}
            isImported={isImported}
          />
        )}
      </div>
    </div>
  );
}
