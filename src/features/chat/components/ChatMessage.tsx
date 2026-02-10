"use client";

import { cn } from "@/utils/cn";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { ChatMessageProps } from "@/features/chat/types";
import { MessageContent } from "./MessageContent";

export function ChatMessage({
  role,
  content,
  imageParts = [],
  isImported,
  isStreaming,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "system") return null;

  const isUser = role === "user";

  return (
    <div
      className={cn("py-3", isUser ? "flex justify-end" : "flex justify-start")}
    >
      <div
        className={cn(
          "group max-w-[92%] sm:max-w-[85%]",
          isUser ? "ml-auto w-fit" : "w-full"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl border px-5 py-4",
            "shadow-sm shadow-black/20",
            isUser
              ? "bg-primary/10 border-primary/20"
              : "bg-muted border-border"
          )}
        >
          <div
            className={cn(
              "prose max-w-none dark:prose-invert",
              "prose-p:leading-relaxed prose-p:mt-0 prose-p:mb-4 last:prose-p:mb-0",
              "prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3",
              "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
              "prose-ul:my-3 prose-ul:list-disc prose-ul:pl-6",
              "prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-6",
              "prose-li:my-1",
              "prose-table:border-collapse prose-table:w-full prose-table:my-4",
              "prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
              "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
              "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-3",
              "prose-hr:my-4 prose-hr:border-border",
              "prose-strong:font-bold prose-strong:text-foreground",
              "prose-em:italic",
              "prose-code:text-sm prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded prose-code:font-medium"
            )}
          >
            {content ? (
              <MessageContent content={content} isStreaming={isStreaming} />
            ) : null}
            {imageParts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imageParts.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Generated ${i + 1}`}
                    className="max-h-80 rounded-lg border border-border object-contain"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions UNDER the bubble (both roles) */}
        {!isStreaming && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 text-xs text-muted-foreground transition-opacity",
              "opacity-60 group-hover:opacity-100",
              isUser && "justify-end"
            )}
          >
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
            {isImported && (
              <span className="text-[11px] px-2 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
                Imported
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
