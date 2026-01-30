"use client";

import { cn } from "@/utils/cn";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState, memo, useCallback } from "react";
import type { ChatMessageProps } from "@/features/chat/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

export function ChatMessage({
  role,
  content,
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
          "group w-[900px] max-w-[92%] sm:max-w-[80%]",
          isUser && "ml-auto",
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl border px-4 py-3",
            "shadow-sm shadow-black/20",
            isUser
              ? "bg-primary/10 border-primary/20"
              : "bg-muted border-border",
          )}
        >
          <div
            className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              "prose-p:leading-relaxed prose-p:mt-0 prose-p:mb-3 last:prose-p:mb-0",
              "prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2",
              "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
              "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5",
              "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5",
              "prose-li:my-0",
              "prose-table:border-collapse prose-table:w-full prose-table:my-3",
              "prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
              "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
              "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-2",
              "prose-hr:my-3 prose-hr:border-border",
              "prose-strong:font-bold prose-strong:text-foreground",
              "prose-em:italic",
            )}
          >
            <MessageContent content={content} isStreaming={isStreaming} />
          </div>
        </div>

        {/* Actions UNDER the bubble (both roles) */}
        {!isStreaming && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 text-xs text-muted-foreground transition-opacity",
              "opacity-60 group-hover:opacity-100",
              isUser && "justify-end",
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

// Code block with copy button and language label
function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  // Extract language from className (e.g., "language-typescript" -> "typescript")
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = useCallback(async () => {
    // Extract text content from children
    const text = extractTextFromChildren(children);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative group/code my-3">
      {/* Header bar with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700 rounded-t-lg">
        <span className="text-xs text-zinc-400 font-mono select-none uppercase">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="mt-0! rounded-t-none! bg-zinc-900 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// Helper to extract text from React children
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    const element = children as React.ReactElement<{ children?: React.ReactNode }>;
    return extractTextFromChildren(element.props.children);
  }
  return "";
}

// Pill-style link component
function PillLink({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  // Extract domain for display
  let displayText = children;
  let domain = "";
  
  try {
    if (href) {
      const url = new URL(href);
      domain = url.hostname.replace("www.", "");
    }
  } catch {
    // Invalid URL, just use the href as-is
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors no-underline hover:no-underline"
    >
      <ExternalLink size={10} className="shrink-0" />
      <span className="truncate max-w-[150px]">
        {typeof displayText === "string" && displayText.startsWith("http")
          ? domain || displayText
          : displayText}
      </span>
    </a>
  );
}

const MessageContent = memo(function MessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom code block rendering with copy button
          pre: ({ children }) => {
            // children is the <code> element
            return <>{children}</>;
          },
          code: ({ className, children, ...props }) => {
            // Check if this is a code block (has language class) or inline code
            const isCodeBlock =
              className?.includes("language-") || className?.includes("hljs");

            if (isCodeBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }

            // Inline code
            return (
              <code
                className="bg-muted/70 px-1.5 py-0.5 rounded text-sm text-primary"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom link as pill
          a: ({ href, children }) => (
            <PillLink href={href}>{children}</PillLink>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
      )}
    </>
  );
});
