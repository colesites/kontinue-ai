"use client";

import { cn } from "@/utils/cn";
import { Copy, Check, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(
    null,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async (src: string, index: number) => {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status})`);
      }

      const blob = await response.blob();
      const extension =
        blob.type === "image/png"
          ? "png"
          : blob.type === "image/jpeg"
            ? "jpg"
            : "webp";
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `generated-${index + 1}.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("[chat-message] failed to download image", error);
    }
  };

  if (role === "system") return null;

  const isUser = role === "user";
  const isImageOnly = !content.trim() && imageParts.length > 0;

  useEffect(() => {
    if (expandedImageIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedImageIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedImageIndex]);

  return (
    <div
      className={cn("py-3", isUser ? "flex justify-end" : "flex justify-start")}
    >
      <div
        className={cn(
          "group max-w-[92%] sm:max-w-[85%]",
          isUser ? "ml-auto w-fit" : "w-fit"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl border",
            isImageOnly ? "px-3 py-3" : "px-5 py-4",
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
                  <div key={i} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedImageIndex(i)}
                      className="cursor-zoom-in overflow-hidden rounded-lg border border-border transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary/50"
                      title="Expand image"
                    >
                      <img
                        src={src}
                        alt={`Generated ${i + 1}`}
                        className="max-h-80 rounded-lg object-contain"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownloadImage(src, i)}
                      className="inline-flex w-fit items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
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
      {expandedImageIndex !== null && imageParts[expandedImageIndex] && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setExpandedImageIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded generated image"
        >
          <button
            type="button"
            onClick={() => setExpandedImageIndex(null)}
            className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs text-white transition-colors hover:bg-black/60"
          >
            <X size={12} />
            Close
          </button>
          <div
            className="relative max-h-[92vh] max-w-[96vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={imageParts[expandedImageIndex]}
              alt={`Expanded generated ${expandedImageIndex + 1}`}
              className="max-h-[92vh] max-w-[96vw] rounded-lg border border-white/20 object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() =>
                void handleDownloadImage(
                  imageParts[expandedImageIndex],
                  expandedImageIndex,
                )
              }
              className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/45 px-2 py-1 text-xs text-white transition-colors hover:bg-black/60"
            >
              <Download size={12} />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
